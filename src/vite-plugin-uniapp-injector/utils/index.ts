/* eslint-disable @typescript-eslint/no-empty-function */
import fs from 'fs';
import { resolve } from 'path';
import { SFCScriptBlock, SFCStyleBlock } from '@vue/compiler-sfc';
import stripJsonComments from '../../module/strip-json-comments';
import { PagesJson, ConfigObject, PageConfig } from '../types/plugin';
import { isValidPageConfig, isValidSubPackageConfig, formatPagePath } from './tool';
import { Logger } from 'tslog';

const logger = new Logger({
  name: 'vite-inset-loader',
  minLevel: process.env.NODE_ENV === 'production' ? 3 : 1,
  type: 'pretty',
  hideLogPositionForProduction: true,
  prettyLogTimeZone: 'local',
  prettyLogTemplate: '{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}\t{{logLevelName}}\t',
});

// 配置状态管理
class ConfigManager {
  private static instance: ConfigManager;
  private rootOption: ConfigObject | null = null;
  private pagesList: PagesJson | null = null;

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  setRootOption(options: ConfigObject): void {
    this.rootOption = options;
  }

  getRootOption(): ConfigObject {
    if (!this.rootOption) {
      throw new Error('Root options not initialized');
    }
    return this.rootOption;
  }

  setPagesList(pages: PagesJson): void {
    this.pagesList = pages;
  }

  getPagesList(): PagesJson {
    if (!this.pagesList) {
      throw new Error('Pages list not initialized');
    }
    return this.pagesList;
  }
}

const configManager = ConfigManager.getInstance();

/**
 * 解析并验证 pages.json 文件
 * @throws {Error} 如果文件无效或解析失败
 */
function parsePagesJson(pagesPath: string): PagesJson {
  try {
    const content = fs.readFileSync(pagesPath, 'utf-8');
    const strippedContent = stripJsonComments(content);
    return JSON.parse(strippedContent) as PagesJson;
  } catch (error) {
    throw new Error(`Failed to parse pages.json: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 初始化页面配置并返回所有页面路径
 * @throws {Error} 如果初始化失败
 */
export const initializePages = (pagesPath: string, rootPath: string, options: ConfigObject): string[] => {
  try {
    // 设置全局配置
    configManager.setRootOption(options);

    // 解析并验证 pages.json
    const pagesJson = parsePagesJson(pagesPath);
    configManager.setPagesList(pagesJson);

    // 收集页面路径
    const paths = new Set<string>();

    // 处理主包页面
    (pagesJson.pages || []).filter(isValidPageConfig).forEach((page) => paths.add(formatPagePath(rootPath, page.path)));

    // 处理分包页面
    (pagesJson.subPackages || []).filter(isValidSubPackageConfig).forEach((pkg) => {
      const pkgRoot = resolve(rootPath, pkg.root);
      pkg.pages.filter(isValidPageConfig).forEach((page) => paths.add(formatPagePath(pkgRoot, page.path)));
    });

    return Array.from(paths);
  } catch (error) {
    throw new Error(`初始化失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

interface PageAnalysisResult {
  [key: string]: {
    label: string[];
  };
}

interface NormalizedPath {
  path: string;
  config: PageConfig;
  root?: string;
}

/**
 * 分析页面路径并生成页面配置映射
 * @returns 页面路径到标签的映射
 * @throws {Error} 如果配置无效
 */
export const analyzePages = (): PageAnalysisResult => {
  const configManager = ConfigManager.getInstance();
  const pagesList = configManager.getPagesList();
  const rootOption = configManager.getRootOption();

  // 配置参数
  const { components, insertPos = {} } = rootOption;
  const { mode = 'GLOBAL', exclude = [], handlePos = [] } = insertPos;

  // 路径规范化
  const normalizeRoutePath = (path: string): string => '/' + path.split('/').filter(Boolean).join('/');

  // 收集所有页面路径
  const collectPaths = (): NormalizedPath[] => {
    const paths: NormalizedPath[] = [];

    // 主包页面
    (pagesList.pages || []).filter(isValidPageConfig).forEach((page) =>
      paths.push({
        path: normalizeRoutePath(page.path),
        config: page,
      }),
    );

    // 分包页面
    (pagesList.subPackages || []).filter(isValidSubPackageConfig).forEach((pkg) => {
      pkg.pages.filter(isValidPageConfig).forEach((page) =>
        paths.push({
          path: normalizeRoutePath(`${pkg.root}/${page.path}`),
          config: page,
          root: pkg.root,
        }),
      );
    });

    return paths;
  };

  // 构建结果映射
  const result: PageAnalysisResult = {};
  const paths = collectPaths();

  // 初始化结果
  paths.forEach(({ path }) => {
    result[path] = { label: [] };
  });

  // 仅在 GLOBAL 模式下处理
  if (mode === 'GLOBAL' && components) {
    const defaultLabels = Object.keys(components);

    // 预构建索引，避免对每个页面做线性扫描（页面数 N * 配置项 M → O(N+M)）
    const excludeSet = new Set(exclude.map((p) => (p.startsWith('/') ? p : `/${p}`)));
    const handlePosMap = new Map<string, string[]>();
    for (const item of handlePos) {
      if (!item.page) continue;
      const norm = item.page.startsWith('/') ? item.page : `/${item.page}`;
      handlePosMap.set(norm, item.insert ?? []);
    }

    paths.forEach(({ path }) => {
      const normPath = path.startsWith('/') ? path : `/${path}`;

      // 检查是否在排除列表中
      if (excludeSet.has(normPath)) {
        return;
      }

      // 获取页面特定配置
      const insert = handlePosMap.get(normPath);

      // 应用标签配置
      result[path] = {
        label: insert ?? defaultLabels,
      };
    });
  }

  return result;
};

/**
 * 根据资源路径获取路由
 * @param rootPath 根路径
 * @param resourcePath 资源路径
 * @returns 标准化的路由路径
 */
export const insertLabel = (rootPath: string, resourcePath: string): string | null => {
  try {
    const pwd = rootPath.replace(/\\/g, '/');
    const relativePath = resourcePath.replace(pwd, '').replace(/\\/g, '/');

    return relativePath.endsWith('.vue') ? relativePath.slice(0, -4) : relativePath;
  } catch (error) {
    logger.error(`路径处理失败: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
};

/**
 * 生成组件DOM标签字符串
 * @param labelArr 标签数组
 * @returns 组件DOM字符串
 */
export const getInsertLabelDom = (labelArr: string[]): string => {
  try {
    // 快速路径：空数组直接返回
    if (!Array.isArray(labelArr) || labelArr.length === 0) {
      return '';
    }

    const configManager = ConfigManager.getInstance();
    const { components } = configManager.getRootOption();

    if (!components) {
      return '';
    }

    return labelArr
      .filter((label) => label && typeof label === 'string' && label in components)
      .map((label) => components[label])
      .join('\n');
  } catch (error) {
    logger.error(`生成组件DOM失败: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
};
/**
 * HTML生成器类
 */
class HtmlGenerator {
  private static readonly PAGE_META_REGEX = /<(?:page-meta|PageMeta|pageMeta)\b[^>]*(?:\/>|>([\s\S]*?)<\/\1)/gi;
  private static readonly COMMENT_REGEX = /<!--(?!.*?(?:#ifdef|#ifndef|#endif)).*?-->/g;

  /**
   * 生成优化的 HTML 代码
   */
  static generateHtml(template: string, labelCode?: string): string {
    try {
      if (!template) return '';

      // 移除 page-meta 标签并清理注释
      const cleanTemplate = template.replace(this.PAGE_META_REGEX, '').replace(this.COMMENT_REGEX, '').trim();

      if (!labelCode && !cleanTemplate) return '';

      const parts = [labelCode, cleanTemplate, ''].filter(Boolean);

      return parts.join('\n');
    } catch (error) {
      logger.error(`HTML生成失败: ${error instanceof Error ? error.message : String(error)}`);
      return template;
    }
  }

  /**
   * 提取 page-meta 标签内容
   */
  static extractPageMeta(template: string): string {
    try {
      const match = template.match(/<(?:page-meta|PageMeta|pageMeta)\b[^>]*(?:\/>|>([\s\S]*?)<\/\1)/i);
      return match ? match[0] : '';
    } catch (error) {
      logger.error(`页面元数据提取失败: ${error instanceof Error ? error.message : String(error)}`);
      return '';
    }
  }
}

/**
 * 样式生成器类
 */
class StyleGenerator {
  /**
   * 生成样式代码
   */
  static generateStyle(styles: SFCStyleBlock[]): string {
    try {
      if (!Array.isArray(styles) || styles.length === 0) return '';

      return styles.reduce((result, style) => {
        // 构建属性字符串
        const attrs: string[] = [];
        if (style.lang) attrs.push(`lang="${style.lang}"`);
        if (style.scoped) attrs.push('scoped');
        if (style.src) attrs.push(`src="${style.src}"`);

        const attrsStr = attrs.length ? ` ${attrs.join(' ')}` : '';

        // 根据是否有 src 属性处理不同情况
        if (style.src) {
          // 外部样式文件
          return result + `<style${attrsStr}></style>\n`;
        } else {
          // 内联样式
          return result + `<style${attrsStr}>\n${style.content}\n</style>\n`;
        }
      }, '');
    } catch (error) {
      logger.error(`样式生成失败: ${error instanceof Error ? error.message : String(error)}`);
      return '';
    }
  }
}

/**
 * 脚本生成器类
 */
class ScriptGenerator {
  /**
   * 生成脚本代码
   */
  static generateScript(script: SFCScriptBlock): string {
    try {
      const attrs = [script.lang && `lang="${script.lang}"`, script.setup && 'setup'].filter(Boolean).join(' ');

      return `<script${attrs ? ` ${attrs}` : ''}>\n${script.content}\n</script>`;
    } catch (error) {
      logger.error(`脚本生成失败: ${error instanceof Error ? error.message : String(error)}`);
      return '';
    }
  }
}

// 导出生成函数
export const generateHtmlCode = HtmlGenerator.generateHtml.bind(HtmlGenerator);
export const getTemplatePageMeta = HtmlGenerator.extractPageMeta.bind(HtmlGenerator);
export const generateStyleCode = StyleGenerator.generateStyle.bind(StyleGenerator);
export const generateScriptCode = ScriptGenerator.generateScript.bind(ScriptGenerator);
