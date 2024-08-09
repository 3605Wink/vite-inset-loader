# vite-inset-loader

vite-inset-loader 是一个专为 UNIAPP 设计的 Vite 插件，旨在为 Vue 3 + Vite 构建的项目提供支持。它允许在编译阶段，在 Vue 单文件组件 (SFC) 的模板中指定位置插入自定义组件和内容。特别适用于需要在每个页面中全局引入组件的场景，例如在小程序开发中插入全局的 message 组件。

## demo
**[demo仓库](https://github.com/3605Wink/uniapp-gy-template)**

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
## viteInsetLoader方法 配置项
| 属性    | 说明                                                                               | 类型               | 默认值 | 是否必传 |
| ------- | ---------------------------------------------------------------------------------- | ------------------ | ------ | -------- |
| include | 过滤需要`inset`组件的目录,若需添加该配置，务必将路径填写正确，若错误则不会执行插入 | string 或 string[] | src    | 否       |
### 示例

``` javascript
import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import viteInsetLoader from 'vite-inset-loader';

export default defineConfig(() => {
  return {
    plugins: [viteInsetLoader({include:['src/pages']}), uni()],
  };
});

```

## pages.json 配置项

### insetLoader 全局配置

| 属性    | 说明                         | 默认值 | 是否必传 |
| ------- | ---------------------------- | ------ | -------- |
| config  | 组件别名与实际组件的映射配置 |        | 否       |
| label   | 与 config 中别名对应         |        | 否       |
| package | 外层包裹组件                 |        | 否       |

### config 配置

```json
 "config": {
      //key值(别名)对应insetLoader中label值
      "message": "<GyMessage ref='messageRef'></GyMessage>", // 消息提示组件
      "dialog": "<GyDialog ref='dialogRef'></GyDialog>" // 对话框组件
  },

```

### label 配置

```json
  "label": ["message", "privacyModal", "dialog"], //对应config中组件别名

```

### package 配置

```json
 "package": {
      "label": "span", // html标签：非必填，若漏传label属性，则默认为div
      "options": {
        // 标签属性配置，支持样式属性及自定义属性
        // 注意：class和id需要是全局样式表中定义的
        "class": "dev-style", // 全局样式类
        "style": {
          "font-size": "24px" // 内联样式
        },
        "data-attr": "content" // 自定义数据属性
      }
 }
```

## 配置 Vite

在您的 `vite.config.ts` 或 `vite.config.js` 文件中，添加并配置 vite-inset-loader 插件。确保在 `uni()` 方法之前调用 `viteInsetLoader()` 方法。

```javascript
import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import viteInsetLoader from 'vite-inset-loader';

export default defineConfig(() => {
  return {
    plugins: [viteInsetLoader(), uni()],
  };
});
```

## 注册全局组件

配置完`pages.json`后，在 `main.ts` 或 `main.js` 文件中，使用 `createSSRApp` 创建应用实例来注册全局组件。

```javascript
import { createSSRApp } from 'vue';
import App from './App.vue';
import GyMessage from './components/GyMessage/index.vue';
export const createApp = () => {
  const app = createSSRApp(App);
  // 注册的全局组件为`pages.json`中config配置的组件
  app.component('GyMessage', GyMessage);
  return { app };
};
```

## 具体配置示例

### 全局配置

```json
{
  // 全局组件配置说明
  "insetLoader": {
    // config仅可在insetLoader中配置，不可在pages中配置
    "config": {
      "message": "<GyMessage ref='messageRef'></GyMessage>",
      "dialog": "<GyDialog ref='dialogRef'></GyDialog>"
    },
    "label": ["message", "dialog"],
    "package": {
      "label": "span",
      "options": {
        "class": "dev-style",
        "style": {
          "font-size": "24px"
        },
        "data-attr": "content"
      }
    }
  }
}
```

### 页面单独配置 (优先级均高于全局配置)

```json
{
    "pages": [
        {
          "path": "pages/home/index",
            "style": {
                "navigationBarTitleText": "首页",
                "label": ["message"],
                "package": {
                    "label": "span",
                    "options": {
                        "class": "dev-style",
                        "style": {
                            "font-size": "24px"
                        },
                        "data-attr": "123468"
                    }
                }
            }  
        }
    ]
}
```

#### 注意事项
- 全局组件的定义必须在 `insetLoader` 属性的 `config` 配置中进行，页面配置中不可配置。
- 全局配置 `insetLoader` 的配置优先级均低于页面中 `page` 配置，页面配置可覆盖 `insetLoader` 配置。
- `label` 属性为数组，数组中的元素为 `config` 配置的组件别名。
- `package` 属性为对象，支持标签属性配置，支持样式属性及自定义属性，若漏传 `label` 属性，则默认为 `div` 标签。
- 若 `package` 不传，那么该页面将不会被标签包裹，例如：
    ```html
    <template>
        <!-- config 中配置的全局组件 -->
        <GyMessage ref="messageRef"></GyMessage> 
        <!-- 主内容 -->
        <div>----</div> 
    </template>
    ```
- 例如 `config` 中引入组件 `GyMessage`，那么在 `main.ts` 或 `main.js` 中使用 `component` 进行全局组件的注册。

### 通过以上步骤，您可以在 Vue 3 + Vite 项目中使用 vite-inset-loader 插件，以支持小程序等场景中的全局组件引入。

### 欢迎提出您的宝贵意见和贡献！**[GitHub 仓库](https://github.com/3605Wink/vite-inset-loader.git)**

## 致谢

- `vite-inset-loader` 的灵感来源于 `vue-inset-loader` 插件，但后者仅适用于 uniapp 的 Vue 2 和 Webpack 版本，无法在 Vite 版本中使用。为此，我们参考了 `vue-inset-loader` 的 GitHub 仓库源码进行了优化，适配了 Vite + Vue 3 的支持。特别感谢 **[vue-inset-loader](https://github.com/1977474741/vite-inset-loader)** 为本插件提供的优化支持。
