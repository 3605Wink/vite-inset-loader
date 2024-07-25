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
}
interface LabelConfig {
    [key: string]: {
        label?: string[];
    };
}

declare const generateLabelCode: (labelArr: string[]) => string;
declare const initPages: (that: any) => boolean;
declare const getPagesMap: () => {
    [key: string]: LabelConfig;
};
declare const generateHtmlCode: (template: string, labelCode: string) => string;
declare const generateStyleCode: (styles: any[]) => any;
declare const generateScriptCode: (script: SFCScriptBlock) => string;
declare const getRoute: (resourcePath: string) => string | null;

export { InsetLoaderConfig, LabelConfig, generateHtmlCode, generateLabelCode, generateScriptCode, generateStyleCode, getPagesMap, getRoute, initPages, viteInsetLoader };
