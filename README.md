# vite-inset-loader

一个专为 UniApp（Vue3 + Vite）设计的编译期注入插件集合，现提供两个入口（互斥，二选一）：

- UniViteRootInjector（推荐）：高性能、类型友好，支持按页面/按需注入与自动路由类型生成。
- UniViteInsetLoader（兼容）：沿用旧版 vite-inset-loader 的 pages.json 驱动注入方式。

文档入口：

- [UniViteRootInjector 使用与配置（推荐）](./docs/UniViteRootInjector.md)
- [UniViteInsetLoader 使用与配置（兼容）](./docs/UniViteInsetLoader.md)

> 性能建议：大型项目优先使用 UniViteRootInjector，具备路由映射缓存与增量计算优化，整体构建体验更好。

## demo

**[demo 仓库](https://github.com/3605Wink/uniapp-gy-template)**

## 安装

```bash
pnpm add vite-inset-loader -D
# 或
npm i vite-inset-loader -D
# 或
yarn add vite-inset-loader -D
```

## 插件入口（二选一）

| 入口函数 | 适用场景 | 特性 | 性能 |
| --- | --- | --- | --- |
| UniViteRootInjector（推荐） | 需要灵活注入、类型提示、按需配置 | 缓存 pages.json、按需注入、自动生成路由类型 | ⭐️⭐️⭐️⭐️⭐️ |
| UniViteInsetLoader | 兼容旧版行为、沿用 pages.json 的标签注入 | 不改动旧配置、快速接入 | ⭐️⭐️⭐️ |

> 注意：两个入口不能同时启用。若在同一 Vite 配置中同时使用，会抛出互斥错误。

## 使用 UniViteRootInjector（推荐）

```ts
import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import { UniViteRootInjector } from 'vite-inset-loader';
import { resolve } from 'node:path';
// 若配置 dts，请在项目中显式引用生成的类型
import type { Path } from './types/auto-page.d';

const components = {
  privacyModal: '<privacyModal></privacyModal>',
  message: '<GyMessage ref="messageRef"></GyMessage>',
  dialog: '<GyDialog ref="dialogRef"></GyDialog>',
  messageBox: '<wd-message-box></wd-message-box>',
  toast: '<wd-toast />',
} as const;

export default defineConfig({
  plugins: [
    uni(),
    UniViteRootInjector<Path, typeof components>({
      dts: resolve(__dirname, 'types/auto-page.d.ts'),
      components,
      insertPos: {
        mode: 'GLOBAL',
        exclude: ['login' as Path], // Path 类型：pages/login/index -> login
        handlePos: [
          { page: 'home' as Path, insert: ['message'] }, // Path 类型：pages/home/index -> home
          { page: 'sub_initiateEvaluation' as Path, insert: ['toast'] }, // 分包：subPackages/sub/initiateEvaluation/index -> sub_initiateEvaluation
        ],
      },
    }),
  ],
});
```

### RootInjector 配置项（节选）

- dts: 路由类型文件生成路径，缺省生成到默认位置
- components: 组件别名到组件字符串的映射，支持类型推断
- insertPos: 注入策略配置
  - mode: 'GLOBAL'（全局模式）
  - exclude: Path[] - 排除的页面路径，使用 Path 类型枚举值
    - 主包页面：`pages/home/index` → `home`
    - 分包页面：`subPackages/sub/initiateEvaluation/index` → `sub_initiateEvaluation`
  - handlePos: 页面特定配置，其中 page 参数为 Path 类型枚举值（生成规则同上）
- includes/watchFile: 可选的包含与监听配置

## 使用 UniViteInsetLoader（兼容模式）

```ts
import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import { UniViteInsetLoader } from 'vite-inset-loader';

export default defineConfig(() => ({
  plugins: [
    UniViteInsetLoader({ include: 'src' }),
    uni(),
  ],
}));
```

### viteInsetLoader 方法配置项

| 属性 | 说明 | 类型 | 默认值 | 必填 |
| --- | --- | --- | --- | --- |
| include | 过滤需要插入组件的目录路径（错误路径将导致不生效） | string \| string[] | 'src' | 否 |

### pages.json 配置（用于 InsetLoader）

insetLoader 依赖 pages.json 中的配置来注入标签：

```json
{
  "insetLoader": {
    "config": {
      "message": "<GyMessage ref='messageRef'></GyMessage>",
      "dialog": "<GyDialog ref='dialogRef'></GyDialog>"
    },
    "label": ["message", "dialog"],
    "package": {
      "label": "span",
      "options": {
        "class": "dev-style",
        "style": { "font-size": "24px" },
        "data-attr": "content"
      }
    }
  }
}
```

页面级覆盖示例（优先级高于全局配置）：

```json
{
  "pages": [
    {
      "path": "pages/home/index",
      "style": {
        "label": ["message"],
        "package": {
          "label": "span",
          "options": {
            "class": "dev-style",
            "style": { "font-size": "24px" },
            "data-attr": "123468"
          }
        }
      }
    }
  ]
}
```

#### 注册全局组件（仅 InsetLoader 场景）

```ts
import { createSSRApp } from 'vue';
import App from './App.vue';
import GyMessage from './components/GyMessage/index.vue';

export const createApp = () => {
  const app = createSSRApp(App);
  app.component('GyMessage', GyMessage); // 需与 pages.json 的 config 别名匹配
  return { app };
};
```

## 常见问题

- 两个入口不能同时使用：内部会检测并抛出错误，用任意一个即可。
- RootInjector 性能更好：更适合页面较多或注入规则复杂的项目。
- 仅命名导出：从 v1.0.10 起包只提供命名导出（不再有默认导出）。

## 进一步阅读

- UniViteRootInjector 使用与配置（推荐）：./docs/UniViteRootInjector.md
- UniViteInsetLoader 使用与配置（兼容）：./docs/UniViteInsetLoader.md

## 致谢

- `vite-inset-loader` 的灵感来源于 `vue-inset-loader`（早期适配 Webpack + Vue2）。本项目在其基础上适配了 Vite + Vue3 并进行了能力扩展与性能优化。

欢迎提出你的建议与 PR：**[GitHub 仓库](https://github.com/3605Wink/vite-inset-loader.git)**
