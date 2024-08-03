/* eslint-disable @typescript-eslint/no-explicit-any */
export interface InsetLoaderConfig {
  label?: string[];
  config?: Record<string, any>;
  package?: ViteInsetLoaderOptions;
}

export interface LabelConfig {
  [key: string]: {
    label?: string[];
    package?: ViteInsetLoaderOptions;
  };
}

export interface ViteInsetLoaderOptions {
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
