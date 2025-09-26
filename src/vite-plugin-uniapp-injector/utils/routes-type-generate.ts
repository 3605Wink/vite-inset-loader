import { resolve, dirname } from 'path';
import fs from 'fs';
import { ConfigObject } from '../types/plugin';

/**
 * 路由信息接口
 */
interface RouteInfo {
  name: string;
  title: string;
  tabBar: boolean;
  path: string;
}

/**
 * Pages.json 配置接口
 */
interface PagesJson {
  pages?: Array<{
    path: string;
    title?: string;
    type?: string;
    style?: Record<string, any>;
  }>;
  subpackages?: Array<{
    root: string;
    pages: Array<{
      path: string;
      title?: string;
      style?: Record<string, any>;
    }>;
  }>;
  subPackages?: Array<{
    root: string;
    pages: Array<{
      path: string;
      title?: string;
      style?: Record<string, any>;
    }>;
  }>;
  tabBar?: {
    list?: Array<{
      pagePath: string;
      text: string;
    }>;
  };
}

/**
 * 提取URL路径的第二段或者将多段路径用下划线连接
 * @param url 需要处理的URL
 * @returns 处理后的字符串
 */
function extractSecondPathSegment(url: string): string {
  const segments = url.split('/').slice(1, -1);
  return segments.length === 1 ? segments[0] : segments.join('_');
}

/**
 * 从 pages.json 解析路由信息
 * @param pagesJsonPath pages.json 文件路径
 * @returns 路由信息数组
 */
function parseRoutesFromPagesJson(pagesJsonPath: string): RouteInfo[] {
  if (!fs.existsSync(pagesJsonPath)) {
    throw new Error(`pages.json 文件不存在: ${pagesJsonPath}`);
  }

  const pagesJson: PagesJson = JSON.parse(fs.readFileSync(pagesJsonPath, 'utf8'));
  const routes = new Map<string, RouteInfo>();

  // 获取 TabBar 页面路径集合
  const tabBarPaths = new Set<string>();
  if (pagesJson.tabBar?.list) {
    pagesJson.tabBar.list.forEach((item) => {
      tabBarPaths.add(item.pagePath);
    });
  }

  // 处理主包页面
  if (pagesJson.pages) {
    pagesJson.pages.forEach((page) => {
      const name = extractSecondPathSegment(page.path);
      if (name) {
        routes.set(name, {
          name,
          title: page.title || name,
          tabBar: tabBarPaths.has(page.path) || page.type === 'tabBar',
          path: page.path,
        });
      }
    });
  }

  // 处理分包页面
  const subpackages = pagesJson.subpackages || pagesJson.subPackages || [];
  subpackages.forEach((subpackage) => {
    const root = subpackage.root;
    subpackage.pages.forEach((page) => {
      const fullPath = `${root}/${page.path}`;
      const name = extractSecondPathSegment(fullPath);
      if (name) {
        routes.set(name, {
          name,
          title: page.title || name,
          tabBar: tabBarPaths.has(fullPath),
          path: fullPath,
        });
      }
    });
  });

  return Array.from(routes.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 生成基础路由类型定义
 * @param routes 路由信息数组
 * @returns 类型定义字符串
 */
function generateBaseTypeDefinition(routes: RouteInfo[]): string {
  const routeNames = routes.map((route) => route.name);

  return `// 此文件由脚本自动生成，请勿手动修改
// 生成时间: ${new Date().toISOString()}

export type Path =
${routeNames.map((name) => `  | '${name}'`).join('\n')};

// 路由映射表类型
export interface RouteMap {
${routeNames.map((name) => `  '${name}': string;`).join('\n')}
}
`;
}

/**
 * 生成增强路由类型定义
 * @param routes 路由信息数组
 * @returns 增强类型定义字符串
 */
function generateEnhancedTypeDefinition(routes: RouteInfo[]): string {
  const routeNames = routes.map((route) => route.name);

  return `// 此文件由脚本自动生成，请勿手动修改
// 生成时间: ${new Date().toISOString()}

import type { Path } from './types';

// 扩展 RouterParams 接口以支持更好的类型提示
export interface EnhancedRouterParams<T extends Path = Path> {
  path: T;
  params?: Record<string, any>;
  close?: 'default' | 'current' | 'all';
}

// 为特定路由提供参数类型约束的接口（可根据具体需求扩展）
export interface RouteParamsMap {
${routes.map((route) => `  '${route.name}': Record<string, any>; // ${route.title}`).join('\n')}
}

// 类型安全的路由推送函数类型
export type TypeSafePush = <T extends Path>(
  data: T | EnhancedRouterParams<T>
) => void;

// 获取特定路由参数的函数类型
export type GetRouteParams = <T extends Path>(
  route: T,
  callback?: (params: T extends keyof RouteParamsMap ? RouteParamsMap[T] : Record<string, any>) => void
) => T extends keyof RouteParamsMap ? RouteParamsMap[T] : Record<string, any>;

// 路由常量映射（用于代码提示和验证）
export const ROUTE_PATHS: Record<Path, string> = {
${routeNames.map((name) => `  '${name}': '${name}'`).join(',\n')},
} as const;

// 路由元数据配置
export interface RouteMetadata {
  title: string;
  requiresAuth?: boolean;
  tabBar?: boolean;
  description?: string;
}

export const ROUTE_METADATA: Record<Path, RouteMetadata> = {
${routes
  .map(
    (route) => `  '${route.name}': {
    title: '${route.title}',
    tabBar: ${route.tabBar},
    description: '${route.title}页面'
  }`,
  )
  .join(',\n')},
} as const;

// 类型守卫函数
export function isValidPath(path: string): path is Path {
  return Object.hasOwnProperty.call(ROUTE_PATHS, path);
}

// 路由工具函数
export const RouteUtils = {
  /**
   * 获取路由的完整信息
   */
  getRouteInfo: (path: Path) => ({
    path,
    metadata: ROUTE_METADATA[path],
    isTabBar: ROUTE_METADATA[path].tabBar || false,
  }),

  /**
   * 验证路由路径是否有效
   */
  validatePath: isValidPath,

  /**
   * 获取所有可用的路由列表
   */
  getAllRoutes: (): Path[] => Object.keys(ROUTE_PATHS) as Path[],

  /**
   * 获取 TabBar 路由列表
   */
  getTabBarRoutes: (): Path[] =>
    Object.keys(ROUTE_METADATA).filter(
      (path) => ROUTE_METADATA[path as Path].tabBar
    ) as Path[],
};
`;
}

/**
 * 写入类型文件（如果内容发生变化）
 * @param filePath 文件路径
 * @param content 文件内容
 * @returns 是否写入了文件
 */
function writeTypeFileIfChanged(filePath: string, content: string): boolean {
  // 确保目录存在
  fs.mkdirSync(dirname(filePath), { recursive: true });

  let needWrite = true;
  if (fs.existsSync(filePath)) {
    const oldContent = fs.readFileSync(filePath, 'utf8');
    if (oldContent === content) {
      needWrite = false;
    }
  }

  if (needWrite) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

/**
 * 从 pages.json 生成完整的路由类型定义
 * @param pagesJsonPath pages.json 文件路径
 * @param options 插件配置对象
 * @returns 生成结果信息
 */
export function generateRouteTypesFromPagesJson(
  pagesJsonPath: string,
  options: ConfigObject,
): {
  baseTypePath: string;
  enhancedTypePath: string;
  routeCount: number;
  generated: boolean;
} {
  try {
    // 解析路由信息
    const routes = parseRoutesFromPagesJson(pagesJsonPath);
    const routeNames = routes.map((route) => route.name);

    // 确定输出目录
    const outputDir = options.dts ? dirname(resolve(process.cwd(), options.dts)) : resolve(process.cwd(), 'src/types');

    // 生成类型定义
    const baseTypeContent = generateBaseTypeDefinition(routes);
    const enhancedTypeContent = generateEnhancedTypeDefinition(routes);

    // 输出文件路径
    const baseTypePath = resolve(outputDir, 'route-types.d.ts');
    const enhancedTypePath = resolve(outputDir, 'route-enhanced-types.d.ts');

    // 写入文件
    const baseGenerated = writeTypeFileIfChanged(baseTypePath, baseTypeContent);
    const enhancedGenerated = writeTypeFileIfChanged(enhancedTypePath, enhancedTypeContent);

    return {
      baseTypePath,
      enhancedTypePath,
      routeCount: routeNames.length,
      generated: baseGenerated || enhancedGenerated,
    };
  } catch (error) {
    throw new Error(`生成路由类型时出错: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 生成路由类型声明文件（兼容原有接口）
 * @param pageNames pages.json name内容
 * @param options 插件配置对象
 * @returns 生成的类型文件绝对路径
 */
export function generateRouteTypes(pageNames: string[], options: ConfigObject): string {
  const typeStr = `// Generated by unplugin-auto-import\nexport type Path = ${pageNames
    .map((n) => `'${n}'`)
    .join(' | ')};\n`;

  // 目标路径优先取 options.dts，否则 src/auto-route.d.ts
  const dtsPath = options.dts ? resolve(process.cwd(), options.dts) : resolve(process.cwd(), 'src/auto-route.d.ts');

  // 使用重构后的写入函数
  writeTypeFileIfChanged(dtsPath, typeStr);

  return dtsPath;
}
