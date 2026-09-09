/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import { Plugin } from 'vite';
import type { AutoConfigObject, ConfigObject } from './types/plugin';
import { initializePages, analyzePages, getInsertLabelDom } from './utils/index';
import { transformSfc } from './utils/descriptor';
import { generateRouteTypes } from './utils/routes-type-generate';
import { logger } from './tslog';

// 页面渲染所需的最小信息（label 数组 + 预编译的注入 DOM 字符串）
interface PageRenderInfo {
  label: string[];
  labelCode: string;
}

// 插件状态接口
interface PluginState {
  pagesMap: Record<string, PageRenderInfo>;
  // 绝对路径 -> route 的 O(1) 索引，避免每个文件做字符串替换匹配
  routeMap: Map<string, string>;
  isInitialized: boolean;
  totalPages: number;
  transformCount: number;
}

// 常量配置
const CONSTANTS = {
  TRANSFORM_LOG_INTERVAL: 20,
  VUE_FILE_REGEX: /\.vue$/,
  WINDOWS_PATH_PREFIX: /^\/+(?=[a-zA-Z]:)/,
} as const;

// 路径规范化（Windows 下 Vite id 可能带前导斜杠如 /D:/xxx，统一为盘符形式）
const normalizeId = (id: string): string => id.replace(/\\/g, '/').replace(CONSTANTS.WINDOWS_PATH_PREFIX, '');

// 解析一次路径配置（hot path 不再重复 resolve）
const resolvePaths = (): { rootPath: string } | null => {
  const inputDir = process.env.UNI_INPUT_DIR || `${process.env.INIT_CWD}/src`;
  if (!inputDir || inputDir.trim() === '') {
    logger.error('Missing required environment variables: UNI_INPUT_DIR or INIT_CWD');
    return null;
  }
  return { rootPath: path.resolve(inputDir) };
};

// 支持外部传入Path类型，实现ConfigObject的泛型类型提示
export function UniViteRootInjector<
  T extends string = string,
  CObj extends Record<string, string> = Record<string, string>,
>(options: AutoConfigObject<T, CObj>): Plugin {
  // 插件状态管理
  const state: PluginState = {
    pagesMap: {},
    routeMap: new Map(),
    isInitialized: false,
    totalPages: 0,
    transformCount: 0,
  };

  let cachedRootPath = '';

  // 初始化插件
  const initialize = () => {
    try {
      const paths = resolvePaths();
      if (!paths) {
        resetState();
        return;
      }
      cachedRootPath = paths.rootPath;

      const pagesPath = path.resolve(cachedRootPath, 'pages.json');
      initializePages(pagesPath, cachedRootPath, options as ConfigObject);

      // 分析页面并预编译注入 DOM（仅一次，transform 热路径直接复用）
      const analyzed = analyzePages();
      const pagesMap: Record<string, PageRenderInfo> = {};
      const routeMap = new Map<string, string>();

      for (const [route, info] of Object.entries(analyzed)) {
        const label = info.label || [];
        pagesMap[route] = {
          label,
          labelCode: getInsertLabelDom(label),
        };
        // route 形如 /pages/home/index，对应真实文件 rootPath/pages/home/index.vue
        const rel = route.replace(/^\//, '');
        const abs = path.resolve(cachedRootPath, `${rel}.vue`);
        routeMap.set(normalizeId(abs), route);
      }

      state.pagesMap = pagesMap;
      state.routeMap = routeMap;
      generateRouteTypes(Object.keys(pagesMap), options as ConfigObject);
      state.totalPages = Object.keys(pagesMap).length;
      state.isInitialized = true;

      if (state.totalPages > 0) {
        logger.info(`Initialized ${state.totalPages} pages`);
      } else {
        logger.warn('No pages found in pages.json');
      }
    } catch (error) {
      logger.error('Initialization failed:', error);
      resetState();
    }
  };

  // 重置插件状态
  const resetState = () => {
    state.pagesMap = {};
    state.routeMap.clear();
    state.isInitialized = false;
    state.totalPages = 0;
    state.transformCount = 0;
    cachedRootPath = '';
  };

  return {
    name: 'vite-inset-loader',
    // 在 Vite 核心(含 @vitejs/plugin-vue 等 SFC 编译链)之前执行:
    // 1)保证拿到未编译的原始 .vue 源码做模板注入,不受其他插件顺序影响;
    // 2)避免对各平台被插件链预处理过的中间代码做无效 SFC parse,降低无效计算。
    // 顺序参考 Vite 5 文档: Alias -> enforce:'pre' 用户插件 -> Vite 核心 -> 普通用户插件 -> enforce:'post'。
    enforce: 'pre',
    buildStart() {
      if (state.isInitialized) {
        return;
      }
      initialize();
    },

    watchChange(id: string, change: { event: string }) {
      if (change.event === 'update' && id.includes('pages.json')) {
        logger.info('Detected pages.json update, reinitializing');
        initialize();
      }
    },

    // Vite 5/6 使用函数形式 transform（兼容 uni-app 官方固定的 vite ^5.2.8）。
    // 若不使用 filter:{id},手动正则快筛成本为一次 test,O(1) 可忽略。
    // 注:Vite 6.3+/8(Rolldown) 支持改成 { filter, handler } 对象形式,让引擎在 Rust 侧
    // 直接过滤非 .vue 文件,可进一步减少跨进程调用——但会失去 Vite 5 兼容,故此处保守实现。
    transform(code: string, id: string) {
      // 非 .vue 文件快速短路（同 filter 语义）
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

      // 更新处理进度（节流日志）
      state.transformCount++;
      const { transformCount, totalPages } = state;
      if (transformCount % CONSTANTS.TRANSFORM_LOG_INTERVAL === 0 || transformCount === totalPages) {
        logger.debug(`Processing pages... ${transformCount}/${totalPages}`);
      }

      try {
        const result = transformSfc(id, code, curPage.label, curPage.labelCode);
        const resultMap = result.map as {
          mappings: string;
          sources: string[];
          names: string[];
          version: number;
        } | null;

        return {
          code: result.code,
          map: resultMap && {
            version: 3,
            file: id,
            mappings: resultMap.mappings,
            sources: resultMap.sources,
            names: resultMap.names,
          },
          ...(result.errors ? { errors: result.errors } : {}),
        };
      } catch (error) {
        logger.error(`Transform failed for ${id}:`, error);
        return { code, map: null };
      }
    },
  };
}
