import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    clean: true,
    dts: true,
    format: 'esm',
  },
  {
    entry: ['src/index.ts'],
    clean: true,
    format: 'cjs',
  },
]);
