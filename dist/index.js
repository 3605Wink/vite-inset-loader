import { parse, MagicString } from '@vue/compiler-sfc';
import fs3 from 'fs';
import path, { resolve, dirname } from 'path';
import { Logger } from 'tslog';

// src/vite-inset-loader/plugin.ts

// src/module/strip-json-comments/index.js
var singleComment = Symbol("singleComment");
var multiComment = Symbol("multiComment");
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
var generateLabelCode = (labelArr) => labelArr.map((e) => {
  var _a;
  return ((_a = insetLoader == null ? void 0 : insetLoader.config) == null ? void 0 : _a[e]) || "";
}).join("");
var initPages = (that) => {
  let pagesPath = ((that == null ? void 0 : that.query) || {}).pagesPath;
  if (!pagesPath) {
    pagesPath = path.resolve(rootPath, "pages.json");
  } else {
    rootPath = path.resolve(path.dirname(pagesPath));
  }
  pagesJson = JSON.parse(stripJsonComments(fs3.readFileSync(pagesPath, "utf8")));
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
  if (!template)
    return "";
  if (!packageEle)
    return html;
  const { label = "div", options } = packageEle;
  const { class: className = "", id = "", style = {}, ...otherOptions } = options;
  const styleAttr = Object.keys(style).length > 0 ? `style="${Object.entries(style).map(([key, value]) => `${key}:${value}`).join(";")}"` : "";
  const otherAttr = Object.entries(otherOptions).map(([key, value]) => `${key}="${value}"`).join(" ");
  return `<${label} class="${className}" id="${id}" ${styleAttr} ${otherAttr}>${html}</${label}>`;
};
var generateStyleCode = (styles) => styles.reduce((str, item, _i) => {
  let attrs = "";
  if (item.lang)
    attrs += ` lang='${item.lang}'`;
  if (item.scoped)
    attrs += ` scoped`;
  if (item.src)
    attrs += ` src='${item.src}'`;
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
  return `<script ${(script == null ? void 0 : script.lang) ? `lang='${script == null ? void 0 : script.lang}'` : ""} ${script.setup ? "setup" : null}>
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
    const arrUrl = include == null ? void 0 : include.map((url) => path.resolve(rootDir2, url).replace(/\\/g, "/"));
    return arrUrl;
  } else {
    return [path.resolve(rootDir2, include || "src").replace(/\\/g, "/")];
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
  var _a;
  shouldHandle = false;
  pagesMap = {};
  try {
    shouldHandle = initPages(that);
    if (shouldHandle) {
      pagesMap = getPagesMap();
    }
  } catch (error) {
    (_a = that == null ? void 0 : that.error) == null ? void 0 : _a.call(that, `vite-inset-loader: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    initialized = true;
  }
};
var viteInsetLoader = (options) => ({
  name: "vite-inset-loader",
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
    var _a, _b;
    const normalizedId = normalizePath(id);
    if (!includeDirectories.length) {
      includeDirectories = filterDirectoriesByInclude(rootDir, options || { include: "src" }).map(normalizePath);
    }
    if (!isTrackedFile(normalizedId))
      return content;
    if (!initialized) {
      initializePages(this);
    }
    if (!shouldHandle)
      return content;
    const route = getRoute(normalizedId);
    if (route == null)
      return content;
    const curPage = pagesMap[route];
    if (!curPage)
      return content;
    const matches = content.match(
      /<script\s+module=".*?"\s+lang="(?:wxs|sjs|filter\.js)"(?:\s+src=".*?")?\s*(?:\/>|>(?:[\s\S]*?)<\/script>)/
    );
    const skipScript = (matches == null ? void 0 : matches[0]) ?? "";
    const { descriptor } = parse(content);
    const labelCode = generateLabelCode(curPage.label);
    const template = generateHtmlCode(((_a = descriptor.template) == null ? void 0 : _a.content) || "", labelCode, curPage.package);
    const pageMeta = getTemplatePageMeta(((_b = descriptor.template) == null ? void 0 : _b.content) || "");
    const style = generateStyleCode((descriptor == null ? void 0 : descriptor.styles) || []);
    const scriptSetup = (descriptor == null ? void 0 : descriptor.scriptSetup) ? generateScriptCode(descriptor.scriptSetup) : "";
    const script = (descriptor == null ? void 0 : descriptor.script) ? generateScriptCode(descriptor.script) : "";
    return ["<template>", pageMeta, template, "</template>", skipScript, scriptSetup, script, style].filter((segment) => typeof segment === "string" && segment.trim().length > 0).join("\n");
  }
});
var logger = new Logger({
  name: "vite-plugin-uniapp-injector",
  minLevel: process.env.NODE_ENV === "production" ? 3 : 1,
  type: "pretty",
  hideLogPositionForProduction: true,
  prettyLogTimeZone: "local",
  prettyLogTemplate: "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}	{{logLevelName}}	"
});
function isValidPageConfig(obj) {
  return !!obj && typeof obj === "object" && "path" in obj;
}
function isValidSubPackageConfig(obj) {
  return !!obj && typeof obj === "object" && "root" in obj && "pages" in obj && Array.isArray(obj.pages);
}
function formatPagePath(root, path3) {
  return resolve(root, `${path3}.vue`).replace(/\\/g, "/");
}
var logger2 = new Logger({
  name: "vite-inset-loader",
  minLevel: process.env.NODE_ENV === "production" ? 3 : 1,
  type: "pretty",
  hideLogPositionForProduction: true,
  prettyLogTimeZone: "local",
  prettyLogTemplate: "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}	{{logLevelName}}	"
});
var ConfigManager = class {
  constructor() {
    this.rootOption = null;
    this.pagesList = null;
  }
  static getInstance() {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
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
    const content = fs3.readFileSync(pagesPath, "utf-8");
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
      const pkgRoot = resolve(rootPath2, pkg.root);
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
    paths.forEach(({ path: path3 }) => {
      const normPath = path3.startsWith("/") ? path3 : `/${path3}`;
      if (exclude.some((p) => normPath === (p.startsWith("/") ? p : `/${p}`))) {
        return;
      }
      const pageConfig = handlePos.find(
        (item) => {
          var _a;
          return normPath === (((_a = item.page) == null ? void 0 : _a.startsWith("/")) ? item.page : `/${item.page}`);
        }
      );
      result[path3] = {
        label: (pageConfig == null ? void 0 : pageConfig.insert) ?? defaultLabels
      };
    });
  }
  return result;
};
var insertLabel = (rootPath2, resourcePath) => {
  try {
    const pwd = rootPath2.replace(/\\/g, "/");
    const relativePath = resourcePath.replace(pwd, "").replace(/\\/g, "/");
    return relativePath.endsWith(".vue") ? relativePath.slice(0, -4) : relativePath;
  } catch (error) {
    logger2.error(`\u8DEF\u5F84\u5904\u7406\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
};
var getInsertLabelDom = (labelArr) => {
  try {
    if (!Array.isArray(labelArr) || labelArr.length === 0) {
      return "";
    }
    const configManager2 = ConfigManager.getInstance();
    const { components } = configManager2.getRootOption();
    if (!components || Object.keys(components).length === 0) {
      return "";
    }
    return labelArr.filter((label) => label && typeof label === "string" && label in components).map((label) => components[label]).join("\n");
  } catch (error) {
    logger2.error(`\u751F\u6210\u7EC4\u4EF6DOM\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
    return "";
  }
};
var HtmlGenerator = class {
  /**
   * 生成优化的 HTML 代码
   */
  static generateHtml(template, labelCode) {
    try {
      if (!template)
        return "";
      const cleanTemplate = template.replace(this.PAGE_META_REGEX, "").replace(this.COMMENT_REGEX, "").trim();
      if (!labelCode && !cleanTemplate)
        return "";
      const parts = [labelCode, cleanTemplate, ""].filter(Boolean);
      return parts.join("\n");
    } catch (error) {
      logger2.error(`HTML\u751F\u6210\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
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
      logger2.error(`\u9875\u9762\u5143\u6570\u636E\u63D0\u53D6\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
      return "";
    }
  }
};
HtmlGenerator.PAGE_META_REGEX = /<(?:page-meta|PageMeta|pageMeta)\b[^>]*(?:\/>|>([\s\S]*?)<\/\1)/gi;
HtmlGenerator.COMMENT_REGEX = /<!--(?!.*?(?:#ifdef|#ifndef|#endif)).*?-->/g;
var StyleGenerator = class {
  /**
   * 生成样式代码
   */
  static generateStyle(styles) {
    try {
      if (!Array.isArray(styles) || styles.length === 0)
        return "";
      return styles.reduce((result, style) => {
        const attrs = [];
        if (style.lang)
          attrs.push(`lang="${style.lang}"`);
        if (style.scoped)
          attrs.push("scoped");
        if (style.src)
          attrs.push(`src="${style.src}"`);
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
      logger2.error(`\u6837\u5F0F\u751F\u6210\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
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
      logger2.error(`\u811A\u672C\u751F\u6210\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
      return "";
    }
  }
};
var generateHtmlCode2 = HtmlGenerator.generateHtml.bind(HtmlGenerator);
var getTemplatePageMeta2 = HtmlGenerator.extractPageMeta.bind(HtmlGenerator);
var generateStyleCode2 = StyleGenerator.generateStyle.bind(StyleGenerator);
var generateScriptCode2 = ScriptGenerator.generateScript.bind(ScriptGenerator);
var transformSfc = (id, content, curPage) => {
  const { descriptor, error } = parseSfcDescriptor(id, content);
  if (error || !descriptor) {
    return {
      code: content,
      map: null,
      errors: error ? [error] : ["\u65E0\u6CD5\u89E3\u6790 SFC \u6587\u4EF6"]
    };
  }
  try {
    const { template, pageMeta, style, scriptSetup, script } = generateSfcParts(descriptor, curPage);
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
    return { descriptor: parse(content).descriptor };
  } catch (err) {
    const errorMessage = `[SFC\u89E3\u6790\u9519\u8BEF] ${id}
\u9519\u8BEF\u4FE1\u606F: ${err instanceof Error ? err.message : String(err)}`;
    return { descriptor: null, error: errorMessage };
  }
};
var generateSfcParts = (descriptor, curPage) => {
  var _a;
  const templateContent = ((_a = descriptor.template) == null ? void 0 : _a.content) || "";
  const labelCode = getInsertLabelDom(curPage.label);
  const template = generateHtmlCode2(templateContent, labelCode);
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
var extractSpecialScripts = (descriptor) => {
  const content = descriptor.source;
  const specialScriptRegex = /<script\s+module="[^"]*"\s+lang="(?:wxs|sjs|filter\.js)"(?:\s+src="[^"]*")?\s*(?:\/>|>([\s\S]*?)<\/script>)/g;
  let match;
  const scripts = [];
  while ((match = specialScriptRegex.exec(content)) !== null) {
    scripts.push(match[0]);
  }
  return scripts.join("\n");
};
var generateSourceMap = (id, originalContent, transformedContent) => {
  const magicString = new MagicString(originalContent);
  magicString.overwrite(0, originalContent.length, transformedContent);
  return {
    code: magicString.toString(),
    map: magicString.generateMap({
      source: id,
      hires: true,
      includeContent: false
    })
  };
};
function writeTypeFileIfChanged(filePath, content) {
  fs3.mkdirSync(dirname(filePath), { recursive: true });
  let needWrite = true;
  if (fs3.existsSync(filePath)) {
    const oldContent = fs3.readFileSync(filePath, "utf8");
    if (oldContent === content) {
      needWrite = false;
    }
  }
  if (needWrite) {
    fs3.writeFileSync(filePath, content, "utf8");
    return true;
  }
  return false;
}
function generateRouteTypes(pageNames, options) {
  const typeStr = `// Generated by unplugin-auto-import
export type Path = ${pageNames.map((n) => `'${n}'`).join(" | ")};
`;
  const dtsPath = options.dts ? resolve(process.cwd(), options.dts) : resolve(process.cwd(), "src/auto-route.d.ts");
  writeTypeFileIfChanged(dtsPath, typeStr);
  return dtsPath;
}

// src/vite-plugin-uniapp-injector/plugin.ts
var CONSTANTS = {
  TRANSFORM_LOG_INTERVAL: 20,
  VUE_FILE_REGEX: /\.vue$/
};
function UniViteRootInjector(options) {
  const state = {
    pagesMap: {},
    isInitialized: false,
    totalPages: 0,
    transformCount: 0
  };
  const getValidatedPaths = () => {
    const inputDir = process.env.UNI_INPUT_DIR || `${process.env.INIT_CWD}/src`;
    if (!inputDir || inputDir.trim() === "") {
      throw new Error("Missing required environment variables: UNI_INPUT_DIR or INIT_CWD");
    }
    return {
      rootPath: path.resolve(inputDir),
      pagesPath: path.resolve(inputDir, "pages.json")
    };
  };
  const initialize = () => {
    try {
      const { rootPath: rootPath2, pagesPath } = getValidatedPaths();
      initializePages2(pagesPath, rootPath2, options);
      state.pagesMap = analyzePages();
      generateRouteTypes(Object.keys(state.pagesMap), options);
      state.totalPages = Object.keys(state.pagesMap).length;
      state.isInitialized = true;
      if (state.totalPages > 0) {
        logger.info(`Initialized ${state.totalPages} pages`);
      } else {
        logger.warn("No pages found in pages.json");
      }
    } catch (error) {
      logger.error("Initialization failed:", error);
      resetState();
    }
  };
  const resetState = () => {
    state.pagesMap = {};
    state.isInitialized = false;
    state.totalPages = 0;
    state.transformCount = 0;
  };
  const logTransformProgress = () => {
    const { transformCount, totalPages } = state;
    if (transformCount % CONSTANTS.TRANSFORM_LOG_INTERVAL === 0 || transformCount === totalPages) {
      const progress = Math.min(100, Math.round(transformCount / totalPages * 100));
      logger.debug(`Processing pages... ${transformCount}/${totalPages} (${progress}%)`);
    }
  };
  return {
    name: "vite-inset-loader",
    buildStart() {
      logger.debug("Starting build initialization");
      if (state.isInitialized) {
        logger.trace("Already initialized, skipping");
        return;
      }
      initialize();
    },
    watchChange(id, change) {
      if (change.event === "update" && id.includes("pages.json")) {
        logger.info("Detected pages.json update, reinitializing");
        initialize();
      }
    },
    async transform(code, id) {
      if (!CONSTANTS.VUE_FILE_REGEX.test(id)) {
        return { code, map: null };
      }
      if (!state.isInitialized) {
        logger.warn("Plugin not initialized, skipping transform");
        return { code, map: null };
      }
      try {
        const { rootPath: rootPath2 } = getValidatedPaths();
        const route = insertLabel(rootPath2, id);
        if (!route) {
          logger.silly(`No route match for ${id}`);
          return { code, map: null };
        }
        const curPage = state.pagesMap[route];
        if (!curPage) {
          logger.silly(`No page config found for route: ${route}`);
          return { code, map: null };
        }
        state.transformCount++;
        logTransformProgress();
        const result = await transformSfc(id, code, curPage);
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
        logger.error(`Transform failed for ${id}:`, error);
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

export { UniViteInsetLoader, UniViteRootInjector2 as UniViteRootInjector };
//# sourceMappingURL=out.js.map
//# sourceMappingURL=index.js.map