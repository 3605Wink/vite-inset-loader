import { defineConfig } from 'tsup';

const EXTERNAL_PACKAGES = [
  'vite',
  '@vue/compiler-sfc',
  'vue-loader',
  'chokidar',
  'debug',
  'tslog',
  'strip-json-comments',
];

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  target: 'node16',
  platform: 'node',
  skipNodeModulesBundle: true,
  external: EXTERNAL_PACKAGES,
  esbuildOptions(options) {
    options.legalComments = 'none';
  },
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
