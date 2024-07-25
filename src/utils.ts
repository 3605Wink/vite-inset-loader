/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import stripJsonComments from './module/strip-json-comments';
import path from 'path';
import { InsetLoaderConfig, LabelConfig } from './types';
import { SFCScriptBlock } from '@vue/compiler-sfc';
// 反序列化后的pages.json对象
let pagesJson: any = {};
// 此loader配置对象
let insetLoader: InsetLoaderConfig = {};
// pages.json文件所在目录
let rootPath = process.env.UNI_INPUT_DIR || process.env.INIT_CWD + '\\src';

// 获取到需要插入的所有label标签
const generateLabelCode = (labelArr: string[]): string =>
  labelArr.map((e) => insetLoader?.config?.[e] || '').join('');

// 反序列化pages.json并缓存，
// 并根据pages.json分析是否有效并且需要后续逻辑处理
const initPages = (that: any): boolean => {
  let pagesPath = (that?.query || {}).pagesPath;
  if (!pagesPath) {
    // 默认读取pages.json
    pagesPath = path.resolve(rootPath, 'pages.json');
  } else {
    // 如有传自定义pagesPath，则截取出所在目录作为rootPath，用于后续匹配路由
    rootPath = path.resolve(path.dirname(pagesPath));
  }
  pagesJson = JSON.parse(stripJsonComments(fs.readFileSync(pagesPath, 'utf8')));
  return initInsetLoader();
};

const getPagesMap = (): { [key: string]: LabelConfig } => {
  // 获取主包路由配置
  const pages = pagesJson.pages || [];
  const subpackages = pagesJson.subpackages || pagesJson.subPackages || [];

  return pages.reduce(
    (obj: { [key: string]: LabelConfig }, item: { path: string }) => {
      const curPage = getLabelConfig(item);
      curPage.label && (obj['/' + item.path] = curPage);
      return obj;
    },
    subpackages.reduce(
      (
        obj: { [key: string]: LabelConfig },
        item: { root: string; pages: any[] },
      ) => {
        // 获取分包路由配置
        const root = item.root;
        item.pages.forEach((item: { path: string; style?: any }) => {
          const curPage = getLabelConfig(item);
          curPage.label && (obj['/' + root + '/' + item.path] = curPage);
        });
        return obj;
      },
      {},
    ),
  );
};

// 生成path对应的对象结构
const getLabelConfig = (json: { path?: string; style?: any }) => {
  return {
    label: (json.style && json.style.label) || insetLoader.label,
  };
};

// 给非必填项设置缺省值，缺少主要对象返回false
const initInsetLoader = (): boolean => {
  insetLoader = pagesJson.insetLoader || ({} as InsetLoaderConfig);
  // label：全局标签配置
  insetLoader.label = insetLoader.label || [];
  // config对象为空视为无效配置
  const effective =
    typeof insetLoader.config === 'object' &&
    Object.keys(insetLoader.config).length > 0;
  return effective;
};

const generateHtmlCode = (template: string, labelCode: string): string => {
  // 确保模板内容存在
  if (!template) {
    return '';
  }
  // 创建一个正则表达式，用于移除HTML注释和首尾空白
  const regClean = /<!--(?!.*?(#ifdef|#ifndef|#endif)).*?-->|^\s+|\s+$/g;
  // 清理模板，移除注释和空白
  let cleanTemplate = template.replace(regClean, '');
  // 将 labelCode 包装在 <div> 标签内，并确保与原有内容间有适当的空白
  cleanTemplate = `<div>\n${labelCode}\n${cleanTemplate}\n</div>`;
  return cleanTemplate;
};

// 根据compiler组合成style标签字符串代码
const generateStyleCode = (styles: any[]) =>
  styles.reduce((str, item, _i) => {
    return (str += `<style ${item.lang ? "lang='" + item.lang + "'" : ''} ${
      item.scoped ? "scoped='" + item.scoped + "'" : ''
    }>
		${item.content}
	</style>`);
  }, '');

// 根据compiler组合成script标签字符串代码
const generateScriptCode = (script: SFCScriptBlock) => {
  return `<script ${script?.lang ? `lang='${script?.lang}'` : ''} ${
    script.setup ? 'setup' : null
  }>
  ${script.content}
</script>`;
};

// 根据resourcePath获取路由
const getRoute = (resourcePath: string): string | null => {
  if (!resourcePath.includes('src')) return null;
  const pwd = rootPath.replace(/\\/g, '/');
  const relativePath = resourcePath.replace(pwd, '').replace(/\\/g, '/');
  // 确保在替换 '.vue' 之前，路径字符串中确实包含 '.vue'
  if (relativePath.endsWith('.vue')) {
    return relativePath.slice(0, -4);
  }
  return relativePath;
};

export {
  initPages,
  getPagesMap,
  getRoute,
  generateLabelCode,
  generateHtmlCode,
  generateStyleCode,
  generateScriptCode,
};
