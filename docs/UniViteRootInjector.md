# UniViteRootInjector 使用与配置

[← 返回 README](../README.md) · [查看 InsetLoader 文档](./UniViteInsetLoader.md)

UniViteRootInjector 是推荐的高性能方案，提供页面级按需注入、路由类型自动生成与更好的增量构建体验。

- 特点：
  - 缓存 pages.json，按需处理匹配页面，构建更快
  - 自动生成路由类型（可配置 dts 生成路径）
  - 基于 components 的 const 断言自动推断组件键名，类型提示友好

## 安装

```bash
pnpm add vite-inset-loader -D
# 或
npm i vite-inset-loader -D
# 或
yarn add vite-inset-loader -D
```

## 快速上手

```ts
import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import { UniViteRootInjector } from 'vite-inset-loader';
import { resolve } from 'node:path';

const components = {
  message: '<gy-message ref="messageRef"></gy-message>',
  dialog: '<gy-dialog ref="dialogRef"></gy-dialog>',
} as const;

export default defineConfig({
  plugins: [
    uni(),
    UniViteRootInjector({
      dts: resolve(__dirname, 'types/auto-route.d.ts'),
      components,
      insertPos: {
        mode: 'GLOBAL',
        exclude: ['pages/login/index'],
        handlePos: [
          { page: 'pages/home/index', insert: ['message'] },
        ],
      },
    }),
  ],
});
```

## 配置项与类型（精确版）

以下为真实类型定义节选，便于查阅（与包内 `src/vite-plugin-uniapp-injector/types/plugin.d.ts` 一致）：

```ts
// 插入模式类型
export type InsertMode = 'GLOBAL';

// 页面处理配置项
export interface HandlePosItem<T extends string = string, C extends string = string> {
  /** 页面路径（如 'pages/home/index'） */
  page?: T;
  /** 需要插入的组件列表（使用 components 的键名） */
  insert?: C[];
}

// 插入位置配置
export interface InsertPosConfig<T extends string = string, C extends string = string> {
  /** 插入模式 */
  mode?: InsertMode;
  /** 排除的页面路径列表 */
  exclude?: T[];
  /** 为特定页面自定义插入组件列表 */
  handlePos?: HandlePosItem<T, C>[];
}

// 主配置对象（通过泛型自动推断组件键名）
export interface ConfigObject<T extends string = string, C extends string = string> {
  /** 组件定义映射（键名会作为 insert 的可选值） */
  components?: Record<C, string>;
  /** 包含的路径列表（可用于限制处理范围） */
  includes?: T[];
  /** 监听的文件路径模式（支持 glob），如 pages.json */
  watchFile?: string | string[];
  /** 插入位置配置 */
  insertPos?: InsertPosConfig<T, C>;
  /** 路由类型文件输出路径（生成 pages Path 类型） */
  dts?: string;
}

// 自动推断组件键名的配置对象（推荐）
export type AutoConfigObject<
  T extends string = string,
  CObj extends Record<string, string> = Record<string, string>,
> = Omit<ConfigObject<T, Extract<keyof CObj, string>>, 'components'> & { components: CObj };
```

### 关键参数说明（含默认）

- dts: string | undefined（默认 undefined）
  - 指定时会生成基于 pages.json 的路由 Path 联合类型，便于智能提示
- components: Record<string, string>（默认 {}）
  - 组件别名到模板片段的映射，建议使用 const 断言以启用键名推断
- insertPos: InsertPosConfig（默认 { mode: 'GLOBAL' }）
  - mode: 'GLOBAL'（当前仅此模式）
  - exclude: string[]（默认 []）
  - handlePos: Array<{ page?: string; insert?: string[] }>
- includes: string[] | undefined（默认 undefined）
  - 可用于限制需要处理的路径集合
- watchFile: string | string[] | undefined（默认 ['src/pages.json'] 或内部默认）
  - 监听 pages.json 或相关配置文件变化

### 类型友好用法

```ts
const components = {
  message: '<gy-message />',
  dialog: '<gy-dialog />',
} as const; // 关键：const 断言使得 insert 只能取 'message' | 'dialog'

UniViteRootInjector({
  components,
  insertPos: {
    mode: 'GLOBAL',
    handlePos: [
      { page: 'pages/home/index', insert: ['message'] }, // 自动校验 'message' 是否存在
    ],
  },
});
```

### 常见用法

- 全局注入少量组件，排除登录/注册页
- 为个别页面追加额外组件
- 配合 dts 生成路由 Path 类型，获得更好的输入提示

### 性能建议

- 页面较多时优先使用 UniViteRootInjector（推荐）
- 合理设置 includes/watchFile，减少不必要的扫描与重建

---

若需要更多示例或遇到问题，欢迎在仓库提 Issue。  
GitHub 仓库：<https://github.com/3605Wink/vite-inset-loader>
