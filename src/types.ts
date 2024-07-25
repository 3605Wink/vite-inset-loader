export interface InsetLoaderConfig {
  label?: string[];
  config?: Record<string, any>;
}

export interface LabelConfig {
  [key: string]: {
    label?: string[];
  };
}
