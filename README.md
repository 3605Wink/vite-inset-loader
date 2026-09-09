---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: d42406d914a5c4fb8e471f3edd5c98cd_6ef821d3ac1511f18f50525400aeaaa3
    ReservedCode1: g3YaCB4ch4bUqO9mJ6sd73PZ1yDkGB/tU77sknCmYbYWhfJrbSvRSzEYRVut7UFJ4jRmqy0m9BL/cBBhIb4svGcuBTv/uLDthLOholac95AWbPqctkOCEpsOlCnnWBM8XJQiSOZCPsIno/Z4HPmSROLIiDW/2YmC8dxGdf6i2Rqvc9F2pqS/39ADgnU=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: d42406d914a5c4fb8e471f3edd5c98cd_6ef821d3ac1511f18f50525400aeaaa3
    ReservedCode2: g3YaCB4ch4bUqO9mJ6sd73PZ1yDkGB/tU77sknCmYbYWhfJrbSvRSzEYRVut7UFJ4jRmqy0m9BL/cBBhIb4svGcuBTv/uLDthLOholac95AWbPqctkOCEpsOlCnnWBM8XJQiSOZCPsIno/Z4HPmSROLIiDW/2YmC8dxGdf6i2Rqvc9F2pqS/39ADgnU=
---

# vite-inset-loader

一个专为 UniApp（Vue3 + Vite）设计的编译期注入插件集合，在 SFC 模板编译前向指定页面插入自定义组件标签。现提供两个入口（互斥，二选一）：

- **UniViteRootInjector（推荐）**：高性能、类型友好，支持按页面/按需注入与自动路由类型生成。
- **UniViteInsetLoader（兼容）**：沿用旧版 vite-inset-loader 的 pages.json 驱动注入方式。

> 文档入口：
> - [UniViteRootInjector 使用与配置（推荐）](./docs/UniViteRootInjector.md)
> - [UniViteInsetLoader 使用与配置（兼容）](./docs/UniViteInsetLoader.md)

## 兼容性

- **Vite 版本**：`>= 5.0.0`（`peerDependencies` 已声明 `vite >=5.0.0`）。当前实现使用 Vite 5 兼容的**函数形式 `transform(code, id)`**，在 Vite 5/6/7/8 下均可用。
- **uni-app 约束**：`@dcloudio/vite-plugin-uni` 目前固定依赖 `vite ^5.2.8`（见其 peerDependencies），因此 uni-app 项目请使用 Vite 5（推荐 ^5.2.8，实测 5.4.21 可用）。Vite 8 的 `{ filter, handler }` 对象形式 transform 与 Rust 侧过滤能力被有意保留为注释说明，避免破坏 Vite 5 兼容。
- **Node.js**：`>= 20.19.0`。

## 安装

```bash
pnpm add vite-inset-loader -D
# 或
npm i vite-inset-loader -D
# 或
yarn add vite-inset-loader -D
```

## 最佳使用位置（重要）

参考 [Vite 5 官方文档-插件 API](https://vitejs.cn/vite5-cn/guide/api-plugin.html) 中的插件顺序模型：

```
Alias -> enforce:'pre' 用户插件 -> Vite 核心插件 -> 普通用户插件 -> Vite 构建插件 -> enforce:'post' 用户插件
```

**本套插件已通过内部 `enforce: 'pre'` 强制定位到「Vite 核心插件」之前执行**：

1. 保证拿到**未被 SFC 编译链（如 @vitejs/plugin-vue）转换过的原始 .vue 源码**做模板注入，注入结果稳定、不受其他插件改写影响；
2. 避免对各平台已被插件链预处理过的中间代码做无效的 `@vue/compiler-sfc` 解析，降低无效计算。

因此配置时**无需手动写 `enforce`**，只需要：

1. `UniViteRootInjector` / `UniViteInsetLoader` 放在 `plugins` 数组**首位**（语义上表达"最先处理"，与 enforce:'pre' 一致，便于他人阅读）；
2. 请勿放在 `uni()` 之后构建类插件之后。

推荐写法：

```ts
export default defineConfig({
  plugins: [
    UniViteRootInjector({ /* ... */ }), // 首位
    uni(),                               // 再加载 uni 官方插件
  ],
});
```

两个插件的 `vite.config.ts` 完整示例见下文。

## demo

**[demo 仓库](https://github.com/3605Wink/uniapp-gy-template)**

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
    // 最佳位置：plugins 数组首位（插件内部已 enforce:'pre'）
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
    uni(),
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
    - 分包页面：`subPackages/sub/initiateEvaluation/index` → `sub_initiateEvaluate`
  - handlePos: 页面特定配置，其中 page 参数为 Path 类型枚举值（生成规则同上）
- includes/watchFile: 可选的包含与监听配置

## 使用 UniViteInsetLoader（兼容模式）

```ts
import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import { UniViteInsetLoader } from 'vite-inset-loader';

export default defineConfig(() => ({
  plugins: [
    UniViteInsetLoader({ include: 'src' }), // 最佳位置：plugins 数组首位
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

## 性能说明

插件在初始化（`buildStart`）阶段完成所有可下沉的预计算，`transform` 热路径仅做 O(1) 查询，已针对 Vite 5 场景做如下优化：

1. **hook 顺序**：内部 `enforce: 'pre'`，在任何 SFC 编译链之前拿到原始 .vue 源码，避免对已转换中间代码做无效 parse。
2. **路由 O(1) 索引**：初始化时构建 `绝对路径 -> route` 的 `routeMap`（`Map`），transform 内一次 `routeMap.get` 命中，取代逐文件字符串替换/线性扫描。
3. **注入 DOM 预编译**：初始化时对每个页面调用一次 `getInsertLabelDom` 生成注入字符串 `labelCode` 并缓存，热路径直接复用，零重复拼接。
4. **快速短路**：transform 开头用单一正则 `/\.vue$/` 过滤（同 Vite 6.3+ filter 语义），非 .vue 文件/未命中的组件文件直接 `return null`（不返回 `{code,map}`，表示未变更，更快）。
5. **sourcemap 轻量化**：`hires: false` + `includeContent: false`，降低大项目 sourcemap 生成成本。
6. **死代码与依赖瘦身**：移除未使用依赖（chokidar/debug/vue-loader 等）与死代码（routes-type-generate 326 行 -> 35 行）。

> 提示：Vite 6.3+/8（Rolldown）支持 `{ filter, handler }` 对象形式 transform，让引擎在 Rust 侧直接过滤非 .vue 文件以进一步减少跨进程调用；但因 uni-app 官方插件固定 vite ^5.2.8，本插件采用函数形式以全版本兼容。

## 常见问题

- 两个入口不能同时使用：内部会检测并抛出错误，用任意一个即可。
- RootInjector 性能更好：更适合页面较多或注入规则复杂的项目。
- 仅命名导出：从 v1.0.10 起包只提供命名导出（不再有默认导出）。
- 安装出现 vite peer 冲突：确认项目 vite 版本为 ^5.2.x（本包 peer 要求 `vite >=5.0.0`，但 uni-app 官方插件要求 ^5.2.8，请以 uni 官方为准）。

## 进一步阅读

- UniViteRootInjector 使用与配置（推荐）：./docs/UniViteRootInjector.md
- UniViteInsetLoader 使用与配置（兼容）：./docs/UniViteInsetLoader.md

## 致谢

- `vite-inset-loader` 的灵感来源于 `vue-inset-loader`（早期适配 Webpack + Vue2）。本项目在其基础上适配了 Vite + Vue3 并进行了能力扩展与性能优化。

欢迎提出你的建议与 PR：**[GitHub 仓库](https://github.com/3605Wink/vite-inset-loader.git)**
*（内容由AI生成，仅供参考）*
