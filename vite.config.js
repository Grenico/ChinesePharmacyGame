import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/ChinesePharmacyGame/', // 明确设置为仓库名称，确保GitHub Pages正确加载
})
