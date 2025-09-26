# UniViteInsetLoader 使用与配置（兼容模式）

UniViteInsetLoader 提供与旧版 vite-inset-loader 一致的行为：基于 pages.json 的声明，在编译期为页面模板注入指定标签/组件。

- 适用场景：希望最小改动平滑迁移、沿用 pages.json 管理注入规则的项目
- 对比建议：若项目页面较多或希望获得更佳性能/类型体验，推荐改用 UniViteRootInjector

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
import { UniViteInsetLoader } from 'vite-inset-loader';

export default defineConfig(() => ({
  plugins: [
    UniViteInsetLoader({ include: 'src' }),
    uni(),
  ],
}));
```

## 配置项

| 属性 | 说明 | 类型 | 默认值 | 必填 |
| --- | --- | --- | --- | --- |
| include | 过滤需要插入组件的目录路径（错误路径将导致不生效） | string \| string[] | 'src' | 否 |

> 注意：若 include 配置的路径不正确（例如没有命中源码所在目录），将不会触发注入。

## pages.json 结构

insetLoader 通过 pages.json 中的 `insetLoader` 字段读取注入规则。

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

## 注册全局组件

部分场景下你需要在入口中注册对应组件（需与 pages.json 的 config 别名匹配）：

```ts
import { createSSRApp } from 'vue';
import App from './App.vue';
import GyMessage from './components/GyMessage/index.vue';

export const createApp = () => {
  const app = createSSRApp(App);
  app.component('GyMessage', GyMessage);
  return { app };
};
```

## 常见问题

- 与 UniViteRootInjector 互斥：两个入口不能在同一 Vite 配置同时使用。若检测到同时启用将抛出错误。
- 性能差异：UniViteInsetLoader 走的是旧式注入流程，页面越多越容易拖慢构建；建议有性能诉求时使用 UniViteRootInjector。
- 排查路径：注入不生效时，优先确认 include 是否指向了源码根目录（通常是 src）。

更多内容请参考 README 或提交 Issue：<https://github.com/3605Wink/vite-inset-loader>
