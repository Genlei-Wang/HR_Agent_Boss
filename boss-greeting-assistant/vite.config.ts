import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './public/manifest.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crx({ manifest: manifest as any }),
  ],
  base: './', // 使用相对路径，确保在Chrome扩展中正常工作
  build: {
    modulePreload: false, // 禁用模块预加载，避免在Service Worker中使用DOM API
    rollupOptions: {
      input: {
        sidepanel: 'src/sidepanel/index.html',
      },
      output: {
        // 禁用模块预加载相关的代码生成
        manualChunks: undefined,
      },
      // 确保 Service Worker 代码不包含 DOM API
      external: (id) => {
        // 不将任何模块标记为外部，但确保不会添加预加载代码
        return false;
      },
    },
    // 禁用所有预加载相关的功能
    cssCodeSplit: false,
  },
  // 确保不会为 Service Worker 添加预加载代码
  optimizeDeps: {
    exclude: [],
  },
});

