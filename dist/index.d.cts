import * as vite from 'vite';
import { Plugin } from 'vite';

interface OPTIONS {
    include?: string | string[];
}

// 定义插入模式类型
type InsertMode = 'GLOBAL';

/**
 * 页面处理配置项
 * @template T - 组件名称类型
 */
interface HandlePosItem<T extends string = string, C extends string = string> {
  /** 页面路径（如 'pages/home' 或 '/pages/home'） */
  page?: T;
  /** 需要插入的组件列表 */
  insert?: C[];
}

/**
 * 插入位置配置
 * @template T - 组件名称类型
 */
interface InsertPosConfig<T extends string = string, C extends string = string> {
  /** 插入模式 */
  mode?: InsertMode;
  /** 排除的页面路径列表 */
  exclude?: T[];
  /** 页面特定配置 */
  handlePos?: HandlePosItem<T, C>[];
}

/**
 * Vite 插件配置对象
 * @template T - 组件名称类型
 */
interface ConfigObject<T extends string = string, C extends string = string> {
  // 组件类型>
  /** 组件定义映射 */
  components?: Record<C, string>;
  /** 包含的路径列表 */
  includes?: T[];
  /** 监听的文件路径模式（支持 glob） */
  watchFile?: string | string[];
  /** 插入位置配置 */
  insertPos?: InsertPosConfig<T, C>;
  /** pages.json 配置 */
  dts?: string;
  /**
   * uniapp 路由配置
   */
}

// 自动推断的配置类型
type AutoConfigObject<
  T extends string = string,
  CObj extends Record<string, string> = Record<string, string>,
> = Omit<ConfigObject<T, Extract<keyof CObj, string>>, 'components'> & { components: CObj };

declare const UniViteInsetLoader: (options?: OPTIONS) => vite.PluginOption;
declare const UniViteRootInjector: <T extends string = string, CObj extends Record<string, string> = Record<string, string>>(options: AutoConfigObject<T, CObj>) => Plugin;

export { type AutoConfigObject, type ConfigObject, type HandlePosItem, type InsertPosConfig, UniViteInsetLoader, type OPTIONS as UniViteInsetLoaderOptions, UniViteRootInjector };
