import type { Plugin } from 'vite';
import { viteInsetLoader } from './vite-inset-loader';
import type { OPTIONS } from './vite-inset-loader/types';
import { UniViteRootInjector as createUniViteRootInjector } from './vite-plugin-uniapp-injector';
import type { AutoConfigObject } from './vite-plugin-uniapp-injector/types/plugin';

type PluginName = 'UniViteInsetLoader' | 'UniViteRootInjector';

let selectedPlugin: PluginName | null = null;

const ensureExclusivePlugin = (name: PluginName): void => {
  if (selectedPlugin && selectedPlugin !== name) {
    throw new Error(
      `vite-inset-loader: 已启用 ${selectedPlugin} 插件，无法同时注册 ${name}。请在 UniViteInsetLoader 与 UniViteRootInjector 之间二选一。`,
    );
  }

  if (!selectedPlugin) {
    selectedPlugin = name;
  }
};

export const UniViteInsetLoader = (options?: OPTIONS) => {
  ensureExclusivePlugin('UniViteInsetLoader');
  return viteInsetLoader(options);
};

export const UniViteRootInjector = <
  T extends string = string,
  CObj extends Record<string, string> = Record<string, string>,
>(
  options: AutoConfigObject<T, CObj>,
): Plugin => {
  ensureExclusivePlugin('UniViteRootInjector');
  return createUniViteRootInjector<T, CObj>(options);
};

export type { OPTIONS as UniViteInsetLoaderOptions } from './vite-inset-loader/types';
export type { ConfigObject, HandlePosItem, InsertPosConfig } from './vite-plugin-uniapp-injector';
export type { AutoConfigObject } from './vite-plugin-uniapp-injector/types/plugin';
