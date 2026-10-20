import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5179,
    strictPort: true,
    watch: {
      // 最后一条很关键：编辑器/工具做原子写时会先建一个 .xxx.tmpdir 目录，
      // 监听它会在 Windows 上抛 EBUSY 把 dev server 打挂。
      ignored: ['**/.preview/**', '**/dist/**', '**/docs/**', '**/scripts/**', '**/.*'],
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 2000,
  },
})
