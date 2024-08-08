"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default,
  filterDirectoriesByInclude: () => filterDirectoriesByInclude,
  generateHtmlCode: () => generateHtmlCode,
  generateLabelCode: () => generateLabelCode,
  generateScriptCode: () => generateScriptCode,
  generateStyleCode: () => generateStyleCode,
  getPagesMap: () => getPagesMap,
  getRoute: () => getRoute,
  initPages: () => initPages
});
module.exports = __toCommonJS(src_exports);

// src/plugin.ts
var import_compiler_sfc = require("@vue/compiler-sfc");

// src/utils.ts
var import_fs = __toESM(require("fs"), 1);

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

// src/utils.ts
var import_path = __toESM(require("path"), 1);
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
    pagesPath = import_path.default.resolve(rootPath, "pages.json");
  } else {
    rootPath = import_path.default.resolve(import_path.default.dirname(pagesPath));
  }
  pagesJson = JSON.parse(stripJsonComments(import_fs.default.readFileSync(pagesPath, "utf8")));
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
    subpackages.reduce(
      (obj, item) => {
        const root = item.root;
        item.pages.forEach((item2) => {
          const curPage = getLabelConfig(item2);
          curPage.label && (obj["/" + root + "/" + item2.path] = curPage);
        });
        return obj;
      },
      {}
    )
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
  const renderHtml = () => {
    const regClean = /<!--(?!.*?(#ifdef|#ifndef|#endif)).*?-->|^\s+|\s+$/g;
    return `${labelCode}
${template.replace(regClean, "").trim()}
`;
  };
  if (!template)
    return "";
  if (!packageEle)
    return renderHtml();
  const { label = "div", options } = packageEle;
  const {
    class: className = "",
    id = "",
    style = {},
    ...otherOptions
  } = options;
  const styleAttr = Object.keys(style).length > 0 ? `style="${Object.entries(style).map(([key, value]) => `${key}:${value}`).join(";")}"` : "";
  const otherAttr = Object.entries(otherOptions).map(([key, value]) => `${key}="${value}"`).join(" ");
  return `<${label} class="${className}" id="${id}" ${styleAttr} ${otherAttr}>${renderHtml()}</${label}>`;
};
var generateStyleCode = (styles) => styles.reduce((str, item, _i) => {
  return str += `<style ${item.lang ? "lang='" + item.lang + "'" : ""} ${item.scoped ? "scoped='" + item.scoped + "'" : ""}>
		${item.content}
	</style>`;
}, "");
var generateScriptCode = (script) => {
  return `<script ${(script == null ? void 0 : script.lang) ? `lang='${script == null ? void 0 : script.lang}'` : ""} ${script.setup ? "setup" : null}>
  ${script.content}
</script>`;
};
var getRoute = (resourcePath) => {
  if (!resourcePath.includes("src"))
    return null;
  const pwd = rootPath.replace(/\\/g, "/");
  const relativePath = resourcePath.replace(pwd, "").replace(/\\/g, "/");
  if (relativePath.endsWith(".vue")) {
    return relativePath.slice(0, -4);
  }
  return relativePath;
};
var filterDirectoriesByInclude = (options) => {
  const { include } = options;
  if (Array.isArray(include)) {
    const arrUrl = include == null ? void 0 : include.map(
      (url) => import_path.default.resolve(process.cwd(), url).replace(/\\/g, "/")
    );
    return arrUrl;
  } else {
    return [import_path.default.resolve(process.cwd(), include || "").replace(/\\/g, "/")];
  }
};

// src/plugin.ts
var pagesMap = {};
var initialized = false;
var shouldHandle = false;
var initializePages = (that) => {
  shouldHandle = initPages(that);
  if (shouldHandle) {
    pagesMap = getPagesMap();
  }
};
var viteInsetLoader = (options) => ({
  name: "vite-inset-loader",
  // 插件名称
  transform: (content, id) => {
    var _a;
    const allDirectories = filterDirectoriesByInclude(
      options || { include: "src" }
    );
    if (!allDirectories.some((path2) => id.includes(path2)))
      return;
    if (!initialized) {
      initialized = true;
      initializePages(void 0);
    }
    const route = getRoute(id);
    if (route == null)
      return content;
    const curPage = pagesMap[route];
    if (curPage == void 0)
      return content;
    const { descriptor } = (0, import_compiler_sfc.parse)(content);
    const labelCode = generateLabelCode(curPage.label);
    const template = generateHtmlCode(
      ((_a = descriptor.template) == null ? void 0 : _a.content) || "",
      labelCode,
      curPage.package
    );
    const style = generateStyleCode((descriptor == null ? void 0 : descriptor.styles) || []);
    const scriptSetup = (descriptor == null ? void 0 : descriptor.scriptSetup) == null ? null : generateScriptCode(descriptor == null ? void 0 : descriptor.scriptSetup);
    const script = (descriptor == null ? void 0 : descriptor.script) == null ? null : generateScriptCode(descriptor == null ? void 0 : descriptor.script);
    return `
<template>
${template}
</template>
${scriptSetup || ""}
${script || ""}
${style || ""}
    `;
  }
});

// src/index.ts
var src_default = viteInsetLoader;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  filterDirectoriesByInclude,
  generateHtmlCode,
  generateLabelCode,
  generateScriptCode,
  generateStyleCode,
  getPagesMap,
  getRoute,
  initPages
});
