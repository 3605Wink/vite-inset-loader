/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { PluginOption } from 'vite';
import { parse } from '@vue/compiler-sfc';
import { LabelConfig } from './types';
import {
  initPages,
  getPagesMap,
  getRoute,
  generateLabelCode,
  generateHtmlCode,
  generateStyleCode,
  generateScriptCode,
} from './utils';

let pagesMap: LabelConfig = {};
let initialized = false;
let shouldHandle = false;
/**
 * 初始化页面配置。
 * @param that - 上下文对象，通常是从 Vite 插件传递的。
 */
const initializePages = (that: any) => {
  // 调用 initPages 函数，判断是否需要处理页面配置
  shouldHandle = initPages(that);
  if (shouldHandle) {
    // 如果需要处理，获取页面配置映射
    pagesMap = getPagesMap();
  }
};

/**
 * Vite 插件入口函数，返回插件配置对象。
 * @returns 插件配置对象。
 */
export const viteInsetLoader = (): PluginOption => ({
  name: 'vite-inset-loader', // 插件名称
  transform: (content, id) => {
    // 转换器函数，处理文件内容
    if (!initialized) {
      initialized = true;
      initializePages(this); // 初始化页面配置
    }

    // 如果文件不是从 src/ 开始，不处理
    if (!id.includes('src')) return content;

    // 获取文件对应的路由路径
    const route = getRoute(id);

    if (route == null) return content;
    // 获取当前页面的配置
    const curPage = pagesMap[route];
    // 如果当前页面没有配置，不处理
    if (curPage == undefined) return content;
    // 解析 Vue 单文件组件内容
    const { descriptor } = parse(content);

    // 生成代码片段
    const labelCode = generateLabelCode(curPage.label!);
    const template = generateHtmlCode(
      descriptor.template?.content || '',
      labelCode,
    );

    const style = generateStyleCode(descriptor?.styles || []);
    const scriptSetup =
      descriptor?.scriptSetup == null
        ? null
        : generateScriptCode(descriptor?.scriptSetup);
    const script =
      descriptor?.script == null
        ? null
        : generateScriptCode(descriptor?.script);
    // 返回处理后的内容
    return `
<template>
${template}
</template>
${scriptSetup || ''}
${script || ''}
${style || ''}
    `;
  },
});