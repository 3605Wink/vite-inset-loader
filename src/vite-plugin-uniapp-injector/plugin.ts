/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import { logger } from './tslog';
import { Plugin } from 'vite';
import { AutoConfigObject } from './types/plugin';
import { initializePages, analyzePages, insertLabel } from './utils/index';
import { transformSfc } from './utils/descriptor';
import { generateRouteTypes } from './utils/routes-type-generate';

// 定义插件状态接口
interface PluginState {
  pagesMap: Record<string, { label: string[] }>;
  isInitialized: boolean;
  totalPages: number;
  transformCount: number;
}

// 常量配置
const CONSTANTS = {
  TRANSFORM_LOG_INTERVAL: 20,
  VUE_FILE_REGEX: /\.vue$/,
} as const;

// 支持外部传入Path类型，实现ConfigObject的泛型类型提示
export function UniViteRootInjector<
  T extends string = string,
  CObj extends Record<string, string> = Record<string, string>,
>(options: AutoConfigObject<T, CObj>): Plugin {
  // 插件状态管理
  const state: PluginState = {
    pagesMap: {},
    isInitialized: false,
    totalPages: 0,
    transformCount: 0,
  };

  // 环境配置验证
  const getValidatedPaths = () => {
    const inputDir = process.env.UNI_INPUT_DIR || `${process.env.INIT_CWD}/src`;
    if (!inputDir || inputDir.trim() === '') {
      throw new Error('Missing required environment variables: UNI_INPUT_DIR or INIT_CWD');
    }
    return {
      rootPath: path.resolve(inputDir),
      pagesPath: path.resolve(inputDir, 'pages.json'),
    };
  };

  // 初始化插件
  const initialize = () => {
    try {
      const { rootPath, pagesPath } = getValidatedPaths();
      initializePages(pagesPath, rootPath, options);
      state.pagesMap = analyzePages();
      generateRouteTypes(Object.keys(state.pagesMap), options);
      state.totalPages = Object.keys(state.pagesMap).length;
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
    state.isInitialized = false;
    state.totalPages = 0;
    state.transformCount = 0;
  };

  // 获取路径配置
  // 日志辅助函数
  const logTransformProgress = () => {
    const { transformCount, totalPages } = state;
    if (transformCount % CONSTANTS.TRANSFORM_LOG_INTERVAL === 0 || transformCount === totalPages) {
      const progress = Math.min(100, Math.round((transformCount / totalPages) * 100));
      logger.debug(`Processing pages... ${transformCount}/${totalPages} (${progress}%)`);
    }
  };

  return {
    name: 'vite-inset-loader',
    buildStart() {
      logger.debug('Starting build initialization');
      if (state.isInitialized) {
        logger.trace('Already initialized, skipping');
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

    async transform(code: string, id: string): Promise<any | null> {
      // 快速过滤非 Vue 文件
      if (!CONSTANTS.VUE_FILE_REGEX.test(id)) {
        return { code, map: null };
      }

      // 确保插件已初始化
      if (!state.isInitialized) {
        logger.warn('Plugin not initialized, skipping transform');
        return { code, map: null };
      }

      try {
        const { rootPath } = getValidatedPaths();
        const route = insertLabel(rootPath, id);

        if (!route) {
          logger.silly(`No route match for ${id}`);
          return { code, map: null };
        }

        const curPage = state.pagesMap[route];
        if (!curPage) {
          logger.silly(`No page config found for route: ${route}`);
          return { code, map: null };
        }

        // 更新处理进度
        state.transformCount++;
        logTransformProgress();

        const result = await transformSfc(id, code, curPage);
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
