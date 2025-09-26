// 定义插入模式类型
export type InsertMode = 'GLOBAL';

/**
 * 页面处理配置项
 * @template T - 组件名称类型
 */
export interface HandlePosItem<T extends string = string, C extends string = string> {
  /** 页面路径（如 'pages/home' 或 '/pages/home'） */
  page?: T;
  /** 需要插入的组件列表 */
  insert?: C[];
}

/**
 * 插入位置配置
 * @template T - 组件名称类型
 */
export interface InsertPosConfig<T extends string = string, C extends string = string> {
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
export interface ConfigObject<T extends string = string, C extends string = string> {
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

// 自动推断组件 key 的工具类型
export type InferComponentKeys<T> = T extends { components: Record<infer K, string> } ? K : string;

// 自动推断的配置类型
export type AutoConfigObject<
  T extends string = string,
  CObj extends Record<string, string> = Record<string, string>,
> = Omit<ConfigObject<T, Extract<keyof CObj, string>>, 'components'> & { components: CObj };
/**
 * 页面配置
 */
export interface PageConfig {
  /** 页面路径（相对于项目根目录） */
  path: string;
  /** 页面标题 */
  title?: string;
  /** 页面样式 */
  style?: string;
  /** 导航栏配置 */
  navigationBar?: {
    titleText?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

/**
 * 分包配置
 */
export interface SubPackageConfig {
  /** 分包根目录 */
  root: string;
  /** 分包页面列表 */
  pages: PageConfig[];
  /** 分包预下载规则 */
  preload?: {
    pages?: string[];
    network?: 'all' | 'wifi';
  };
}

/**
 * pages.json 配置
 */
export interface PagesJson {
  /** 全局样式配置 */
  globalStyle?: PageConfig;
  /** 主包页面列表 */
  pages?: PageConfig[];
  /** 分包列表 */
  subPackages?: SubPackageConfig[];
  /** tabBar 配置 */
  tabBar?: {
    color?: string;
    selectedColor?: string;
    list: Array<{
      text: string;
      pagePath: string;
    }>;
  };
}

/**
 * 页面标签配置
 */
export interface LabelConfig {
  [path: string]: {
    /** 页面需要插入的标签列表 */
    label?: string[];
  };
}

/**
 * 插件选项配置
 */
export interface ViteInsetLoaderOptions {
  /** 标签名称 */
  label: string;
}
