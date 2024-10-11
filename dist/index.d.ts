import { PluginOption } from 'vite';
import { SFCScriptBlock } from '@vue/compiler-sfc';

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
interface OPTIONS {
    include?: string | string[];
}

/**
 * Vite 插件入口函数，返回插件配置对象。
 * @returns 插件配置对象。
 */
declare const viteInsetLoader: (options?: OPTIONS) => PluginOption;

declare const generateLabelCode: (labelArr: string[]) => string;
declare const initPages: (that: any) => boolean;
declare const getPagesMap: () => {
    [key: string]: LabelConfig;
};
declare const generateHtmlCode: (template: string, labelCode: string, packageEle: ViteInsetLoaderOptions | null) => string;
declare const generateStyleCode: (styles: any[]) => any;
declare const generateScriptCode: (script: SFCScriptBlock) => string;
declare const getRoute: (resourcePath: string) => string | null;
declare const filterDirectoriesByInclude: (rootDir: string, options: OPTIONS) => string[];
declare const getTemplatePageMeta: (template: string) => string;

export { InsetLoaderConfig, LabelConfig, OPTIONS, ViteInsetLoaderOptions, viteInsetLoader as default, filterDirectoriesByInclude, generateHtmlCode, generateLabelCode, generateScriptCode, generateStyleCode, getPagesMap, getRoute, getTemplatePageMeta, initPages };
