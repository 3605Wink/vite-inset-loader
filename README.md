# vite-inset-loader
vite-inset-loader 是一个 Vite 插件，专为 Vue 3 + Vite 构建的项目设计，用于在编译阶段在 Vue 单文件组件 (SFC) 的模板中指定位置插入自定义内容。它特别适用于需要在每个页面中全局引入组件的场景，例如在小程序开发中。
## 安装
在您的项目中安装 vite-inset-loader 插件，可以使用以下命令：
```bash
pnpm install vite-inset-loader --save-dev
```
或者，如果您使用 npm：
```bash
npm install vite-inset-loader --save-dev
```
## 配置 Vite
在您的 `vite.config.ts` 或 `vite.config.js` 文件中，添加并配置 vite-inset-loader 插件。确保在 `uni()` 方法之前添加 `viteInsetLoader()` 方法。
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
在您的 `pages.json` 配置文件中，添加 `insetLoader` 配置。这允许您定义全局组件和它们在页面中的插入位置。
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
        // 配置单独页面的标签优先级高于insetLoader中的label,比如当前页面只插入message，那么privacyModal组件就不会插入
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
- **`config`** (默认: `{}`): 定义组件标签名称和内容的键值对。这允许您指定哪些组件应该在所有页面中全局插入。
- **`label`** (默认: `[]`): 需要在所有页面中插入的标签数组。这些标签将被打包并插入到每个页面的模板中。
## 优先级说明
- `label` 和 `rootEle` 支持在单独页面的 `style` 配置中设置，并且它们的优先级高于全局配置。
通过以上步骤，您可以在 Vue 3 + Vite 项目中使用 vite-inset-loader 插件，以便在小程序等场景中全局引入组件。

## 致谢
- `vite-inset-loader` 灵感来源于 `vue-inset-loader` 插件，但是`vue-inset-loader`仅适用于uniapp vue2、webpack版本，无法在vite版本中使用，所以参照`vue-inset-loader`github仓库源码对其优化，进行了vite插件的适配，以支持 Vite + Vue 3。

特别感谢 **[vue-inset-loader](https://github.com/1977474741/vite-inset-loader)** 为本插件提供了的优化支持。



