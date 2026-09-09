import { defineConfig } from 'tsup';

const EXTERNAL_PACKAGES = [
  'vite',
  '@vue/compiler-sfc',
  'tslog',
];

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  target: 'node20',
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
