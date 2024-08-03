import { PluginOption } from 'vite';
import { SFCScriptBlock } from '@vue/compiler-sfc';

/**
 * Vite 插件入口函数，返回插件配置对象。
 * @returns 插件配置对象。
 */
declare const viteInsetLoader: () => PluginOption;

interface InsetLoaderConfig {
    label?: string[];
    config?: Record<string, any>;
    package?: ViteInsetLoaderOptions;
}
interface LabelConfig {
    [key: string]: {
        label?: string[];
        package?: ViteInsetLoaderOptions;
    };
}
interface ViteInsetLoaderOptions {
    label: string;
    options: {
        class?: string;
        id?: string;
        style: {
            [key: string]: string;
        };
        [key: string]: any;
    };
}

declare const generateLabelCode: (labelArr: string[]) => string;
declare const initPages: (that: any) => boolean;
declare const getPagesMap: () => {
    [key: string]: LabelConfig;
};
declare const generateHtmlCode: (template: string, labelCode: string, packageEle: ViteInsetLoaderOptions | null) => string;
declare const generateStyleCode: (styles: any[]) => any;
declare const generateScriptCode: (script: SFCScriptBlock) => string;
declare const getRoute: (resourcePath: string) => string | null;

export { InsetLoaderConfig, LabelConfig, ViteInsetLoaderOptions, viteInsetLoader as default, generateHtmlCode, generateLabelCode, generateScriptCode, generateStyleCode, getPagesMap, getRoute, initPages };
