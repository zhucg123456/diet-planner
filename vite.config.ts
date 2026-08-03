import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 部署在子路径 /diet-planner/ 下，资源引用需带上前缀
  base: '/diet-planner/',
})
