import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'errors/index': 'src/errors/index.ts',
    'i18n/provider': 'src/i18n/provider.tsx',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    '@zicenter/form-kit',
    'react',
    'react-dom',
    'react-router-dom',
    'react-hook-form',
    '@tanstack/react-query',
    '@tanstack/react-table',
    'axios',
    'zod',
    'i18next',
    'react-i18next',
    'date-fns',
  ],
});
