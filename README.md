# vite-inset-loader

vite-inset-loader 是一个专为 UNIAPP 设计的 Vite 插件，旨在为 Vue 3 + Vite 构建的项目提供支持。它允许在编译阶段，在 Vue 单文件组件 (SFC) 的模板中指定位置插入自定义组件和内容。特别适用于需要在每个页面中全局引入组件的场景，例如在小程序开发中插入全局的 message 组件。

## 安装

要在您的项目中安装 vite-inset-loader 插件，可以使用以下命令：

```bash
pnpm install vite-inset-loader
```

或者，如果您使用 npm：

```bash
npm install vite-inset-loader
```

或者，如果您使用 yarn

```bash
yarn install vite-inset-loader
```

## 配置 Vite

在您的 `vite.config.ts` 或 `vite.config.js` 文件中，添加并配置 vite-inset-loader 插件。确保在 `uni()` 方法之前调用 `viteInsetLoader()` 方法。

```javascript
import { defineConfig } from 'vite';
import { viteInsetLoader } from 'vite-inset-loader';
import uni from '@dcloudio/vite-plugin-uni';
export default defineConfig(() => {
  return {
    plugins: [viteInsetLoader(), uni()],
  };
});
```

## 配置 pages.json

在您的 `pages.json` 配置文件中，添加 `insetLoader` 配置。这将允许您定义全局组件及其在页面中的插入位置。

```json
{
  "insetLoader": {
    "config": {
      "privacyModal": "<privacyModal></privacyModal>",
      "message": "<GyMessage ref='messageRef'></GyMessage>",
      "dialog": "<GyDialog ref='dialogRef'></GyDialog>"
    },
    "label": ["message", "privacyModal"]
  },
  "pages": [
    {
      "path": "pages/home/index",
      "style": {
        "navigationBarTitleText": "首页",
        // 配置单独页面的标签优先级高于 insetLoader 中的 label，比如当前页面只插入 message，那么 privacyModal 组件就不会插入
        "label": ["message"]
      }
    }
  ]
}
```

在此配置中，`config` 对象定义了全局组件及其标签，而 `label` 数组指定了需要在所有页面中插入的组件标签。

## 注册全局组件

在 `main.ts` 或 `main.js` 文件中，使用 `createSSRApp` 创建的应用实例来注册全局组件。

```javascript
import { createSSRApp } from 'vue';
import App from './App.vue';
import GyMessage from './components/GyMessage/index.vue';
export const createApp = () => {
  const app = createSSRApp(App);
  app.component('GyMessage', GyMessage);
  return { app };
};
```

## 配置说明

- **`config`** (默认: `{}`): 定义组件标签名称和内容的键值对，允许您指定哪些组件应在所有页面中全局插入。
- **`label`** (默认: `[]`): 需要在所有页面中插入的标签数组。这些标签将被打包并插入到每个页面的模板中。

## 优先级说明

- `label` 可以在单独页面的 `style` 配置中设置，并且它们的优先级高于全局配置。

### 通过以上步骤，您可以在 Vue 3 + Vite 项目中使用 vite-inset-loader 插件，以支持小程序等场景中的全局组件引入。

### 欢迎提出您的宝贵意见和贡献！**[GitHub 仓库](https://github.com/3605Wink/vite-inset-loader.git)**

## 致谢

- `vite-inset-loader` 的灵感来源于 `vue-inset-loader` 插件，但后者仅适用于 uniapp 的 Vue 2 和 Webpack 版本，无法在 Vite 版本中使用。为此，我们参考了 `vue-inset-loader` 的 GitHub 仓库源码进行了优化，适配了 Vite + Vue 3 的支持。特别感谢 **[vue-inset-loader](https://github.com/1977474741/vite-inset-loader)** 为本插件提供的优化支持。
