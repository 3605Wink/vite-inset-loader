/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { PluginOption } from 'vite';
import { parse } from '@vue/compiler-sfc';
import { LabelConfig, OPTIONS } from './types';
import {
  initPages,
  getPagesMap,
  getRoute,
  generateLabelCode,
  generateHtmlCode,
  generateStyleCode,
  generateScriptCode,
  filterDirectoriesByInclude,
  getTemplatePageMeta,
} from './utils';

let pagesMap: LabelConfig = {};
let initialized = false;
let shouldHandle = false;
let includeDirectories: string[] = [];
// 当前项目根目录路径
let rootDir: string;

const normalizePath = (value: string): string => value.replace(/\\/g, '/');

const isTrackedFile = (id: string): boolean => includeDirectories.some((dir) => id.startsWith(dir));
/**
 * 初始化页面配置。
 * @param that - 上下文对象，通常是从 Vite 插件传递的。
 */
const initializePages = (that: any) => {
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

/**
 * Vite 插件入口函数，返回插件配置对象。
 * @returns 插件配置对象。
 */
export const viteInsetLoader = (options?: OPTIONS): PluginOption => ({
  name: 'vite-inset-loader',
  configResolved(config) {
    rootDir = config.root;
    includeDirectories = filterDirectoriesByInclude(rootDir, options || { include: 'src' }).map(normalizePath);
  },
  buildStart() {
    initialized = false;
    includeDirectories = includeDirectories.length
      ? includeDirectories
      : filterDirectoriesByInclude(rootDir, options || { include: 'src' }).map(normalizePath);
    initializePages(this);
  },
  transform(content, id) {
    const normalizedId = normalizePath(id);

    if (!includeDirectories.length) {
      includeDirectories = filterDirectoriesByInclude(rootDir, options || { include: 'src' }).map(normalizePath);
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
      /<script\s+module=".*?"\s+lang="(?:wxs|sjs|filter\.js)"(?:\s+src=".*?")?\s*(?:\/>|>(?:[\s\S]*?)<\/script>)/,
    );
    const skipScript = matches?.[0] ?? '';

    const { descriptor } = parse(content);
    const labelCode = generateLabelCode(curPage.label!);
    const template = generateHtmlCode(descriptor.template?.content || '', labelCode, curPage.package!);
    const pageMeta = getTemplatePageMeta(descriptor.template?.content || '');
    const style = generateStyleCode(descriptor?.styles || []);
    const scriptSetup = descriptor?.scriptSetup ? generateScriptCode(descriptor.scriptSetup) : '';
    const script = descriptor?.script ? generateScriptCode(descriptor.script) : '';

    return ['<template>', pageMeta, template, '</template>', skipScript, scriptSetup, script, style]
      .filter((segment) => typeof segment === 'string' && segment.trim().length > 0)
      .join('\n');
  },
});
