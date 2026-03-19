import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/main.ts' },
  outDir: 'dist',
  format: 'esm'
})
