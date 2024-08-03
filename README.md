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

## 配置项
### insetLoader 全局配置
| 属性    | 说明                         | 默认值 | 是否必传 |
| ------- | ---------------------------- | ------ | -------- |
| config  | 组件别名与实际组件的映射配置 |        | 否       |
| label   | 与config中别名对应           |        | 否       |
| package | 外层包裹组件                 |        | 否       |


### config配置 
``` json
 "config": {
      //key值(别名)对应insetLoader中label值
      "privacyModal": "<privacyModal></privacyModal>", // 隐私模态框组件
      "message": "<GyMessage ref='messageRef'></GyMessage>", // 消息提示组件
      "dialog": "<GyDialog ref='dialogRef'></GyDialog>" // 对话框组件
  },

```
### label配置

``` json
  "label": ["message", "privacyModal", "dialog"], //对应config中组件别名

```
### package配置

``` json
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


## 具体配置示例

###  全局配置

```json
{
  // 全局组件配置说明
  // 注意：以下配置中，页面特定组件的优先级高于全局配置。
  "insetLoader": {
    // 组件别名与实际组件的映射配置
    "config": {
      "privacyModal": "<privacyModal></privacyModal>", // 隐私模态框组件
      "message": "<GyMessage ref='messageRef'></GyMessage>", // 消息提示组件
      "dialog": "<GyDialog ref='dialogRef'></GyDialog>" // 对话框组件
    },
    // 以下标签为全局组件，将被注入到所有页面中。
    // 注意：若在页面级别配置中存在相同标签，则优先使用页面配置的组件。
    "label": ["message", "privacyModal", "dialog"],
    // 全局包裹组件配置，可包含样式属性如class、id、style等，也支持自定义属性如data-attr、img、href、src等。
    // 注意：class和id应为全局定义的样式。
    // 全局包裹组件的优先级低于页面级配置。
    "package": {
      "label": "span", // 标签名称 若该
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
  }
}

```
### 页面单独配置 (优先级均高于全局配置)

``` json
"pages": [
		{
			"path": "pages/home/index",
			"style": {
				"navigationBarTitleText": "首页",
				// 优先级高于insetLoader
				"label": ["message"],
				// 外层包裹组件，可为空，优先级高于insetLoader中配置
				"package": {
					"label": "span",
					"options": {
						// options中支持class、id、style等样式属性，也可传入其他属性，类似data-attr、img、href、src等
						// 注：class、id需为全局样式
						"class": "dev-style",
						"style": {
							"font-size": "24px"
						},
						"data-attr": "123468"
					}
				}
			}
		},
		{
			"path": "pages/user/index",
			"style": {
				"navigationBarTitleText": "我的",
			}
		}
	]


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


### 通过以上步骤，您可以在 Vue 3 + Vite 项目中使用 vite-inset-loader 插件，以支持小程序等场景中的全局组件引入。

### 欢迎提出您的宝贵意见和贡献！**[GitHub 仓库](https://github.com/3605Wink/vite-inset-loader.git)**

## 致谢

- `vite-inset-loader` 的灵感来源于 `vue-inset-loader` 插件，但后者仅适用于 uniapp 的 Vue 2 和 Webpack 版本，无法在 Vite 版本中使用。为此，我们参考了 `vue-inset-loader` 的 GitHub 仓库源码进行了优化，适配了 Vite + Vue 3 的支持。特别感谢 **[vue-inset-loader](https://github.com/1977474741/vite-inset-loader)** 为本插件提供的优化支持。
