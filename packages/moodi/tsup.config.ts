import { defineConfig } from 'tsup';

const shared = {
  format: ['esm', 'cjs'] as ('esm' | 'cjs')[],
  dts: true,
  minify: true,
  treeshake: true,
  target: 'es2020',
  external: ['three', 'react', 'moodi'],
};

export default defineConfig([
  { ...shared, entry: { index: 'src/index.ts' }, clean: true },
  { ...shared, treeshake: false, entry: { react: 'src/react.tsx' }, banner: { js: '"use client";' } },
]);
