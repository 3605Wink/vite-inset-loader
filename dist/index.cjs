'use strict';

var compilerSfc = require('@vue/compiler-sfc');
var fs3 = require('fs');
var path = require('path');
var tslog = require('tslog');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var fs3__default = /*#__PURE__*/_interopDefault(fs3);
var path__default = /*#__PURE__*/_interopDefault(path);

// src/vite-inset-loader/plugin.ts

// src/module/strip-json-comments/index.js
var singleComment = /* @__PURE__ */ Symbol("singleComment");
var multiComment = /* @__PURE__ */ Symbol("multiComment");
var stripWithoutWhitespace = () => "";
var stripWithWhitespace = (string, start, end) => string.slice(start, end).replace(/\S/g, " ");
var isEscaped = (jsonString, quotePosition) => {
  let index = quotePosition - 1;
  let backslashCount = 0;
  while (jsonString[index] === "\\") {
    index -= 1;
    backslashCount += 1;
  }
  return Boolean(backslashCount % 2);
};
function stripJsonComments(jsonString, { whitespace = true, trailingCommas = false } = {}) {
  if (typeof jsonString !== "string") {
    throw new TypeError(`Expected argument \`jsonString\` to be a \`string\`, got \`${typeof jsonString}\``);
  }
  const strip = whitespace ? stripWithWhitespace : stripWithoutWhitespace;
  let isInsideString = false;
  let isInsideComment = false;
  let offset = 0;
  let buffer = "";
  let result = "";
  let commaIndex = -1;
  for (let index = 0; index < jsonString.length; index++) {
    const currentCharacter = jsonString[index];
    const nextCharacter = jsonString[index + 1];
    if (!isInsideComment && currentCharacter === '"') {
      const escaped = isEscaped(jsonString, index);
      if (!escaped) {
        isInsideString = !isInsideString;
      }
    }
    if (isInsideString) {
      continue;
    }
    if (!isInsideComment && currentCharacter + nextCharacter === "//") {
      buffer += jsonString.slice(offset, index);
      offset = index;
      isInsideComment = singleComment;
      index++;
    } else if (isInsideComment === singleComment && currentCharacter + nextCharacter === "\r\n") {
      index++;
      isInsideComment = false;
      buffer += strip(jsonString, offset, index);
      offset = index;
      continue;
    } else if (isInsideComment === singleComment && currentCharacter === "\n") {
      isInsideComment = false;
      buffer += strip(jsonString, offset, index);
      offset = index;
    } else if (!isInsideComment && currentCharacter + nextCharacter === "/*") {
      buffer += jsonString.slice(offset, index);
      offset = index;
      isInsideComment = multiComment;
      index++;
      continue;
    } else if (isInsideComment === multiComment && currentCharacter + nextCharacter === "*/") {
      index++;
      isInsideComment = false;
      buffer += strip(jsonString, offset, index + 1);
      offset = index + 1;
      continue;
    } else if (trailingCommas && !isInsideComment) {
      if (commaIndex !== -1) {
        if (currentCharacter === "}" || currentCharacter === "]") {
          buffer += jsonString.slice(offset, index);
          result += strip(buffer, 0, 1) + buffer.slice(1);
          buffer = "";
          offset = index;
          commaIndex = -1;
        } else if (currentCharacter !== " " && currentCharacter !== "	" && currentCharacter !== "\r" && currentCharacter !== "\n") {
          buffer += jsonString.slice(offset, index);
          offset = index;
          commaIndex = -1;
        }
      } else if (currentCharacter === ",") {
        result += buffer + jsonString.slice(offset, index);
        buffer = "";
        offset = index;
        commaIndex = index;
      }
    }
  }
  return result + buffer + (isInsideComment ? strip(jsonString.slice(offset)) : jsonString.slice(offset));
}
var pagesJson = {};
var insetLoader = {};
var rootPath = process.env.UNI_INPUT_DIR || process.env.INIT_CWD + "\\src";
var generateLabelCode = (labelArr) => labelArr.map((e) => insetLoader?.config?.[e] || "").join("");
var initPages = (that) => {
  let pagesPath = (that?.query || {}).pagesPath;
  if (!pagesPath) {
    pagesPath = path__default.default.resolve(rootPath, "pages.json");
  } else {
    rootPath = path__default.default.resolve(path__default.default.dirname(pagesPath));
  }
  pagesJson = JSON.parse(stripJsonComments(fs3__default.default.readFileSync(pagesPath, "utf8")));
  return initInsetLoader();
};
var getPagesMap = () => {
  const pages = pagesJson.pages || [];
  const subpackages = pagesJson.subpackages || pagesJson.subPackages || [];
  return pages.reduce(
    (obj, item) => {
      const curPage = getLabelConfig(item);
      curPage.label && (obj["/" + item.path] = curPage);
      return obj;
    },
    subpackages.reduce((obj, item) => {
      const root = item.root;
      item.pages.forEach((item2) => {
        const curPage = getLabelConfig(item2);
        curPage.label && (obj["/" + root + "/" + item2.path] = curPage);
      });
      return obj;
    }, {})
  );
};
var getLabelConfig = (json) => {
  return {
    label: json.style && json.style.label || insetLoader.label,
    package: json.style && json.style.package || insetLoader.package || null
  };
};
var initInsetLoader = () => {
  insetLoader = pagesJson.insetLoader || {};
  insetLoader.label = insetLoader.label || [];
  const effective = typeof insetLoader.config === "object" && Object.keys(insetLoader.config).length > 0;
  return effective;
};
var generateHtmlCode = (template, labelCode, packageEle) => {
  const hasClosingTag = ["</pageMeta>", "</PageMeta>", "</page-meta>"].some((label2) => template.includes(label2));
  const regex = hasClosingTag ? /<(page-meta|PageMeta|pageMeta)\b[^>]*>([\s\S]*?)<\/\1>/gi : /<(page-meta|PageMeta|pageMeta)\b[^>]*\/>/gi;
  const renderHtml = (content) => {
    const regClean = /<!--(?!.*?(#ifdef|#ifndef|#endif)).*?-->|^\s+|\s+$/g;
    return `${labelCode}
${content.replace(regClean, "").trim()}
`;
  };
  const html = renderHtml(containsPageMetaTag(template) ? template.replace(regex, "") : template);
  if (!template) return "";
  if (!packageEle) return html;
  const { label = "div", options } = packageEle;
  const { class: className = "", id = "", style = {}, ...otherOptions } = options;
  const styleAttr = Object.keys(style).length > 0 ? `style="${Object.entries(style).map(([key, value]) => `${key}:${value}`).join(";")}"` : "";
  const otherAttr = Object.entries(otherOptions).map(([key, value]) => `${key}="${value}"`).join(" ");
  return `<${label} class="${className}" id="${id}" ${styleAttr} ${otherAttr}>${html}</${label}>`;
};
var generateStyleCode = (styles) => styles.reduce((str, item, _i) => {
  let attrs = "";
  if (item.lang) attrs += ` lang='${item.lang}'`;
  if (item.scoped) attrs += ` scoped`;
  if (item.src) attrs += ` src='${item.src}'`;
  if (item.src) {
    return str + `<style${attrs}></style>
`;
  } else {
    return str + `<style${attrs}>
${item.content}
</style>
`;
  }
}, "");
var generateScriptCode = (script) => {
  return `<script ${script?.lang ? `lang='${script?.lang}'` : ""} ${script.setup ? "setup" : null}>
  ${script.content}
</script>`;
};
var getRoute = (resourcePath) => {
  const pwd = rootPath.replace(/\\/g, "/");
  const relativePath = resourcePath.replace(pwd, "").replace(/\\/g, "/");
  if (relativePath.endsWith(".vue")) {
    return relativePath.slice(0, -4);
  }
  return relativePath;
};
var filterDirectoriesByInclude = (rootDir2, options) => {
  const { include } = options;
  if (Array.isArray(include)) {
    const arrUrl = include?.map((url) => path__default.default.resolve(rootDir2, url).replace(/\\/g, "/"));
    return arrUrl;
  } else {
    return [path__default.default.resolve(rootDir2, include || "src").replace(/\\/g, "/")];
  }
};
var getTemplatePageMeta = (template) => {
  const hasClosingTag = ["</pageMeta>", "</PageMeta>", "</page-meta>"].some((label) => template.includes(label));
  const regex = hasClosingTag ? /<(page-meta|PageMeta|pageMeta)\b[^>]*>([\s\S]*?)<\/\1>/gi : /<(page-meta|PageMeta|pageMeta)\b[^>]*\/>/gi;
  const match = regex.exec(template);
  return match ? match[0] : "";
};
var containsPageMetaTag = (htmlString) => {
  const pageMateTagPattern = /<page-meta\b[^>]*>/i;
  return pageMateTagPattern.test(htmlString);
};

// src/vite-inset-loader/plugin.ts
var pagesMap = {};
var initialized = false;
var shouldHandle = false;
var includeDirectories = [];
var rootDir;
var normalizePath = (value) => value.replace(/\\/g, "/");
var isTrackedFile = (id) => includeDirectories.some((dir) => id.startsWith(dir));
var initializePages = (that) => {
  shouldHandle = false;
  pagesMap = {};
  try {
    shouldHandle = initPages(that);
    if (shouldHandle) {
      pagesMap = getPagesMap();
    }
  } catch (error) {
    that?.error?.(`vite-inset-loader: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    initialized = true;
  }
};
var viteInsetLoader = (options) => ({
  name: "vite-inset-loader",
  // enforce:'pre' 确保在 Vite 核心 SFC 编译链之前拿到原始 .vue 源码,
  // 与 UniViteRootInjector 保持一致的执行位置最佳实践(见 README「最佳使用位置」)。
  enforce: "pre",
  configResolved(config) {
    rootDir = config.root;
    includeDirectories = filterDirectoriesByInclude(rootDir, options || { include: "src" }).map(normalizePath);
  },
  buildStart() {
    initialized = false;
    includeDirectories = includeDirectories.length ? includeDirectories : filterDirectoriesByInclude(rootDir, options || { include: "src" }).map(normalizePath);
    initializePages(this);
  },
  transform(content, id) {
    const normalizedId = normalizePath(id);
    if (!includeDirectories.length) {
      includeDirectories = filterDirectoriesByInclude(rootDir, options || { include: "src" }).map(normalizePath);
    }
    if (!isTrackedFile(normalizedId)) return content;
    if (!initialized) {
      initializePages(this);
    }
    if (!shouldHandle) return content;
    const route = getRoute(normalizedId);
    if (route == null) return content;
    const curPage = pagesMap[route];
    if (!curPage) return content;
    const matches = content.match(
      /<script\s+module=".*?"\s+lang="(?:wxs|sjs|filter\.js)"(?:\s+src=".*?")?\s*(?:\/>|>(?:[\s\S]*?)<\/script>)/
    );
    const skipScript = matches?.[0] ?? "";
    const { descriptor } = compilerSfc.parse(content);
    const labelCode = generateLabelCode(curPage.label);
    const template = generateHtmlCode(descriptor.template?.content || "", labelCode, curPage.package);
    const pageMeta = getTemplatePageMeta(descriptor.template?.content || "");
    const style = generateStyleCode(descriptor?.styles || []);
    const scriptSetup = descriptor?.scriptSetup ? generateScriptCode(descriptor.scriptSetup) : "";
    const script = descriptor?.script ? generateScriptCode(descriptor.script) : "";
    return ["<template>", pageMeta, template, "</template>", skipScript, scriptSetup, script, style].filter((segment) => typeof segment === "string" && segment.trim().length > 0).join("\n");
  }
});
function isValidPageConfig(obj) {
  return !!obj && typeof obj === "object" && "path" in obj;
}
function isValidSubPackageConfig(obj) {
  return !!obj && typeof obj === "object" && "root" in obj && "pages" in obj && Array.isArray(obj.pages);
}
function formatPagePath(root, path3) {
  return path.resolve(root, `${path3}.vue`).replace(/\\/g, "/");
}
var logger = new tslog.Logger({
  name: "vite-inset-loader",
  minLevel: process.env.NODE_ENV === "production" ? 3 : 1,
  type: "pretty",
  hideLogPositionForProduction: true,
  prettyLogTimeZone: "local",
  prettyLogTemplate: "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}	{{logLevelName}}	"
});
var ConfigManager = class _ConfigManager {
  static instance;
  rootOption = null;
  pagesList = null;
  constructor() {
  }
  static getInstance() {
    if (!_ConfigManager.instance) {
      _ConfigManager.instance = new _ConfigManager();
    }
    return _ConfigManager.instance;
  }
  setRootOption(options) {
    this.rootOption = options;
  }
  getRootOption() {
    if (!this.rootOption) {
      throw new Error("Root options not initialized");
    }
    return this.rootOption;
  }
  setPagesList(pages) {
    this.pagesList = pages;
  }
  getPagesList() {
    if (!this.pagesList) {
      throw new Error("Pages list not initialized");
    }
    return this.pagesList;
  }
};
var configManager = ConfigManager.getInstance();
function parsePagesJson(pagesPath) {
  try {
    const content = fs3__default.default.readFileSync(pagesPath, "utf-8");
    const strippedContent = stripJsonComments(content);
    return JSON.parse(strippedContent);
  } catch (error) {
    throw new Error(`Failed to parse pages.json: ${error instanceof Error ? error.message : String(error)}`);
  }
}
var initializePages2 = (pagesPath, rootPath2, options) => {
  try {
    configManager.setRootOption(options);
    const pagesJson2 = parsePagesJson(pagesPath);
    configManager.setPagesList(pagesJson2);
    const paths = /* @__PURE__ */ new Set();
    (pagesJson2.pages || []).filter(isValidPageConfig).forEach((page) => paths.add(formatPagePath(rootPath2, page.path)));
    (pagesJson2.subPackages || []).filter(isValidSubPackageConfig).forEach((pkg) => {
      const pkgRoot = path.resolve(rootPath2, pkg.root);
      pkg.pages.filter(isValidPageConfig).forEach((page) => paths.add(formatPagePath(pkgRoot, page.path)));
    });
    return Array.from(paths);
  } catch (error) {
    throw new Error(`\u521D\u59CB\u5316\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
  }
};
var analyzePages = () => {
  const configManager2 = ConfigManager.getInstance();
  const pagesList = configManager2.getPagesList();
  const rootOption = configManager2.getRootOption();
  const { components, insertPos = {} } = rootOption;
  const { mode = "GLOBAL", exclude = [], handlePos = [] } = insertPos;
  const normalizeRoutePath = (path3) => "/" + path3.split("/").filter(Boolean).join("/");
  const collectPaths = () => {
    const paths2 = [];
    (pagesList.pages || []).filter(isValidPageConfig).forEach(
      (page) => paths2.push({
        path: normalizeRoutePath(page.path),
        config: page
      })
    );
    (pagesList.subPackages || []).filter(isValidSubPackageConfig).forEach((pkg) => {
      pkg.pages.filter(isValidPageConfig).forEach(
        (page) => paths2.push({
          path: normalizeRoutePath(`${pkg.root}/${page.path}`),
          config: page,
          root: pkg.root
        })
      );
    });
    return paths2;
  };
  const result = {};
  const paths = collectPaths();
  paths.forEach(({ path: path3 }) => {
    result[path3] = { label: [] };
  });
  if (mode === "GLOBAL" && components) {
    const defaultLabels = Object.keys(components);
    const excludeSet = new Set(exclude.map((p) => p.startsWith("/") ? p : `/${p}`));
    const handlePosMap = /* @__PURE__ */ new Map();
    for (const item of handlePos) {
      if (!item.page) continue;
      const norm = item.page.startsWith("/") ? item.page : `/${item.page}`;
      handlePosMap.set(norm, item.insert ?? []);
    }
    paths.forEach(({ path: path3 }) => {
      const normPath = path3.startsWith("/") ? path3 : `/${path3}`;
      if (excludeSet.has(normPath)) {
        return;
      }
      const insert = handlePosMap.get(normPath);
      result[path3] = {
        label: insert ?? defaultLabels
      };
    });
  }
  return result;
};
var getInsertLabelDom = (labelArr) => {
  try {
    if (!Array.isArray(labelArr) || labelArr.length === 0) {
      return "";
    }
    const configManager2 = ConfigManager.getInstance();
    const { components } = configManager2.getRootOption();
    if (!components) {
      return "";
    }
    return labelArr.filter((label) => label && typeof label === "string" && label in components).map((label) => components[label]).join("\n");
  } catch (error) {
    logger.error(`\u751F\u6210\u7EC4\u4EF6DOM\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
    return "";
  }
};
var HtmlGenerator = class {
  static PAGE_META_REGEX = /<(?:page-meta|PageMeta|pageMeta)\b[^>]*(?:\/>|>([\s\S]*?)<\/\1)/gi;
  static COMMENT_REGEX = /<!--(?!.*?(?:#ifdef|#ifndef|#endif)).*?-->/g;
  /**
   * 生成优化的 HTML 代码
   */
  static generateHtml(template, labelCode) {
    try {
      if (!template) return "";
      const cleanTemplate = template.replace(this.PAGE_META_REGEX, "").replace(this.COMMENT_REGEX, "").trim();
      if (!labelCode && !cleanTemplate) return "";
      const parts = [labelCode, cleanTemplate, ""].filter(Boolean);
      return parts.join("\n");
    } catch (error) {
      logger.error(`HTML\u751F\u6210\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
      return template;
    }
  }
  /**
   * 提取 page-meta 标签内容
   */
  static extractPageMeta(template) {
    try {
      const match = template.match(/<(?:page-meta|PageMeta|pageMeta)\b[^>]*(?:\/>|>([\s\S]*?)<\/\1)/i);
      return match ? match[0] : "";
    } catch (error) {
      logger.error(`\u9875\u9762\u5143\u6570\u636E\u63D0\u53D6\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
      return "";
    }
  }
};
var StyleGenerator = class {
  /**
   * 生成样式代码
   */
  static generateStyle(styles) {
    try {
      if (!Array.isArray(styles) || styles.length === 0) return "";
      return styles.reduce((result, style) => {
        const attrs = [];
        if (style.lang) attrs.push(`lang="${style.lang}"`);
        if (style.scoped) attrs.push("scoped");
        if (style.src) attrs.push(`src="${style.src}"`);
        const attrsStr = attrs.length ? ` ${attrs.join(" ")}` : "";
        if (style.src) {
          return result + `<style${attrsStr}></style>
`;
        } else {
          return result + `<style${attrsStr}>
${style.content}
</style>
`;
        }
      }, "");
    } catch (error) {
      logger.error(`\u6837\u5F0F\u751F\u6210\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
      return "";
    }
  }
};
var ScriptGenerator = class {
  /**
   * 生成脚本代码
   */
  static generateScript(script) {
    try {
      const attrs = [script.lang && `lang="${script.lang}"`, script.setup && "setup"].filter(Boolean).join(" ");
      return `<script${attrs ? ` ${attrs}` : ""}>
${script.content}
</script>`;
    } catch (error) {
      logger.error(`\u811A\u672C\u751F\u6210\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
      return "";
    }
  }
};
var generateHtmlCode2 = HtmlGenerator.generateHtml.bind(HtmlGenerator);
var getTemplatePageMeta2 = HtmlGenerator.extractPageMeta.bind(HtmlGenerator);
var generateStyleCode2 = StyleGenerator.generateStyle.bind(StyleGenerator);
var generateScriptCode2 = ScriptGenerator.generateScript.bind(ScriptGenerator);
var transformSfc = (id, content, label, labelCode) => {
  const { descriptor, error } = parseSfcDescriptor(id, content);
  if (error || !descriptor) {
    return {
      code: content,
      map: null,
      errors: error ? [error] : ["\u65E0\u6CD5\u89E3\u6790 SFC \u6587\u4EF6"]
    };
  }
  try {
    const { template, pageMeta, style, scriptSetup, script } = generateSfcParts(descriptor, label, labelCode);
    const transformedContent = buildTransformedContent({
      template,
      pageMeta,
      descriptor,
      style,
      scriptSetup,
      script
    });
    return generateSourceMap(id, content, transformedContent);
  } catch (err) {
    return {
      code: content,
      map: null,
      errors: [`\u8F6C\u6362\u8FC7\u7A0B\u51FA\u9519: ${err instanceof Error ? err.message : String(err)}`]
    };
  }
};
var parseSfcDescriptor = (id, content) => {
  try {
    return { descriptor: compilerSfc.parse(content).descriptor };
  } catch (err) {
    const errorMessage = `[SFC\u89E3\u6790\u9519\u8BEF] ${id}
\u9519\u8BEF\u4FE1\u606F: ${err instanceof Error ? err.message : String(err)}`;
    return { descriptor: null, error: errorMessage };
  }
};
var generateSfcParts = (descriptor, label, labelCode) => {
  const templateContent = descriptor.template?.content || "";
  const needInject = label.length > 0 && !labelCode;
  const injectLabelCode = needInject ? getInsertLabelDom(label) : labelCode || "";
  const template = generateHtmlCode2(templateContent, injectLabelCode);
  const pageMeta = getTemplatePageMeta2(templateContent);
  const style = generateStyleCode2(descriptor.styles || []);
  const scriptSetup = descriptor.scriptSetup ? generateScriptCode2(descriptor.scriptSetup) : null;
  const script = descriptor.script ? generateScriptCode2(descriptor.script) : null;
  return {
    template,
    pageMeta,
    style,
    scriptSetup,
    script
  };
};
var buildTransformedContent = ({
  template,
  pageMeta,
  descriptor,
  style,
  scriptSetup,
  script
}) => {
  const specialScripts = extractSpecialScripts(descriptor);
  const parts = [
    "<template>",
    pageMeta,
    template,
    "</template>",
    specialScripts,
    scriptSetup || "",
    script || "",
    style || ""
  ];
  return parts.join("\n").trim();
};
var specialScriptRegex = /<script\s+module="[^"]*"\s+lang="(?:wxs|sjs|filter\.js)"(?:\s+src="[^"]*")?\s*(?:\/>|>([\s\S]*?)<\/script>)/g;
var extractSpecialScripts = (descriptor) => {
  const content = descriptor.source;
  let match;
  const scripts = [];
  while ((match = specialScriptRegex.exec(content)) !== null) {
    scripts.push(match[0]);
  }
  return scripts.join("\n");
};
var generateSourceMap = (id, originalContent, transformedContent) => {
  const magicString = new compilerSfc.MagicString(originalContent);
  magicString.overwrite(0, originalContent.length, transformedContent);
  return {
    code: magicString.toString(),
    map: magicString.generateMap({
      source: id,
      hires: false,
      includeContent: false
    })
  };
};
function writeTypeFileIfChanged(filePath, content) {
  fs3__default.default.mkdirSync(path.dirname(filePath), { recursive: true });
  let needWrite = true;
  if (fs3__default.default.existsSync(filePath)) {
    const oldContent = fs3__default.default.readFileSync(filePath, "utf8");
    if (oldContent === content) {
      needWrite = false;
    }
  }
  if (needWrite) {
    fs3__default.default.writeFileSync(filePath, content, "utf8");
  }
}
function generateRouteTypes(pageNames, options) {
  const typeStr = `// Generated by unplugin-auto-import
export type Path = ${pageNames.map((n) => `'${n}'`).join(" | ")};
`;
  const dtsPath = options.dts ? path.resolve(process.cwd(), options.dts) : path.resolve(process.cwd(), "src/auto-route.d.ts");
  writeTypeFileIfChanged(dtsPath, typeStr);
  return dtsPath;
}
var logger2 = new tslog.Logger({
  name: "vite-plugin-uniapp-injector",
  minLevel: process.env.NODE_ENV === "production" ? 3 : 1,
  type: "pretty",
  hideLogPositionForProduction: true,
  prettyLogTimeZone: "local",
  prettyLogTemplate: "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}	{{logLevelName}}	"
});

// src/vite-plugin-uniapp-injector/plugin.ts
var CONSTANTS = {
  TRANSFORM_LOG_INTERVAL: 20,
  VUE_FILE_REGEX: /\.vue$/,
  WINDOWS_PATH_PREFIX: /^\/+(?=[a-zA-Z]:)/
};
var normalizeId = (id) => id.replace(/\\/g, "/").replace(CONSTANTS.WINDOWS_PATH_PREFIX, "");
var resolvePaths = () => {
  const inputDir = process.env.UNI_INPUT_DIR || `${process.env.INIT_CWD}/src`;
  if (!inputDir || inputDir.trim() === "") {
    logger2.error("Missing required environment variables: UNI_INPUT_DIR or INIT_CWD");
    return null;
  }
  return { rootPath: path__default.default.resolve(inputDir) };
};
function UniViteRootInjector(options) {
  const state = {
    pagesMap: {},
    routeMap: /* @__PURE__ */ new Map(),
    isInitialized: false,
    totalPages: 0,
    transformCount: 0
  };
  let cachedRootPath = "";
  const initialize = () => {
    try {
      const paths = resolvePaths();
      if (!paths) {
        resetState();
        return;
      }
      cachedRootPath = paths.rootPath;
      const pagesPath = path__default.default.resolve(cachedRootPath, "pages.json");
      initializePages2(pagesPath, cachedRootPath, options);
      const analyzed = analyzePages();
      const pagesMap2 = {};
      const routeMap = /* @__PURE__ */ new Map();
      for (const [route, info] of Object.entries(analyzed)) {
        const label = info.label || [];
        pagesMap2[route] = {
          label,
          labelCode: getInsertLabelDom(label)
        };
        const rel = route.replace(/^\//, "");
        const abs = path__default.default.resolve(cachedRootPath, `${rel}.vue`);
        routeMap.set(normalizeId(abs), route);
      }
      state.pagesMap = pagesMap2;
      state.routeMap = routeMap;
      generateRouteTypes(Object.keys(pagesMap2), options);
      state.totalPages = Object.keys(pagesMap2).length;
      state.isInitialized = true;
      if (state.totalPages > 0) {
        logger2.info(`Initialized ${state.totalPages} pages`);
      } else {
        logger2.warn("No pages found in pages.json");
      }
    } catch (error) {
      logger2.error("Initialization failed:", error);
      resetState();
    }
  };
  const resetState = () => {
    state.pagesMap = {};
    state.routeMap.clear();
    state.isInitialized = false;
    state.totalPages = 0;
    state.transformCount = 0;
    cachedRootPath = "";
  };
  return {
    name: "vite-inset-loader",
    // 在 Vite 核心(含 @vitejs/plugin-vue 等 SFC 编译链)之前执行:
    // 1)保证拿到未编译的原始 .vue 源码做模板注入,不受其他插件顺序影响;
    // 2)避免对各平台被插件链预处理过的中间代码做无效 SFC parse,降低无效计算。
    // 顺序参考 Vite 5 文档: Alias -> enforce:'pre' 用户插件 -> Vite 核心 -> 普通用户插件 -> enforce:'post'。
    enforce: "pre",
    buildStart() {
      if (state.isInitialized) {
        return;
      }
      initialize();
    },
    watchChange(id, change) {
      if (change.event === "update" && id.includes("pages.json")) {
        logger2.info("Detected pages.json update, reinitializing");
        initialize();
      }
    },
    // Vite 5/6 使用函数形式 transform（兼容 uni-app 官方固定的 vite ^5.2.8）。
    // 若不使用 filter:{id},手动正则快筛成本为一次 test,O(1) 可忽略。
    // 注:Vite 6.3+/8(Rolldown) 支持改成 { filter, handler } 对象形式,让引擎在 Rust 侧
    // 直接过滤非 .vue 文件,可进一步减少跨进程调用——但会失去 Vite 5 兼容,故此处保守实现。
    transform(code, id) {
      if (!CONSTANTS.VUE_FILE_REGEX.test(id)) {
        return null;
      }
      if (!state.isInitialized) {
        return null;
      }
      const route = state.routeMap.get(normalizeId(id));
      if (!route) {
        return null;
      }
      const curPage = state.pagesMap[route];
      if (!curPage) {
        return null;
      }
      state.transformCount++;
      const { transformCount, totalPages } = state;
      if (transformCount % CONSTANTS.TRANSFORM_LOG_INTERVAL === 0 || transformCount === totalPages) {
        logger2.debug(`Processing pages... ${transformCount}/${totalPages}`);
      }
      try {
        const result = transformSfc(id, code, curPage.label, curPage.labelCode);
        const resultMap = result.map;
        return {
          code: result.code,
          map: resultMap && {
            version: 3,
            file: id,
            mappings: resultMap.mappings,
            sources: resultMap.sources,
            names: resultMap.names
          },
          ...result.errors ? { errors: result.errors } : {}
        };
      } catch (error) {
        logger2.error(`Transform failed for ${id}:`, error);
        return { code, map: null };
      }
    }
  };
}

// src/index.ts
var selectedPlugin = null;
var ensureExclusivePlugin = (name) => {
  if (selectedPlugin && selectedPlugin !== name) {
    throw new Error(
      `vite-inset-loader: \u5DF2\u542F\u7528 ${selectedPlugin} \u63D2\u4EF6\uFF0C\u65E0\u6CD5\u540C\u65F6\u6CE8\u518C ${name}\u3002\u8BF7\u5728 UniViteInsetLoader \u4E0E UniViteRootInjector \u4E4B\u95F4\u4E8C\u9009\u4E00\u3002`
    );
  }
  if (!selectedPlugin) {
    selectedPlugin = name;
  }
};
var UniViteInsetLoader = (options) => {
  ensureExclusivePlugin("UniViteInsetLoader");
  return viteInsetLoader(options);
};
var UniViteRootInjector2 = (options) => {
  ensureExclusivePlugin("UniViteRootInjector");
  return UniViteRootInjector(options);
};

exports.UniViteInsetLoader = UniViteInsetLoader;
exports.UniViteRootInjector = UniViteRootInjector2;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map