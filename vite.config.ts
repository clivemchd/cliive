import { defineConfig } from 'vite'

export default defineConfig({
  base: '/', // Use '/' for custom domain, change to '/repository-name/' if using username.github.io/repository-name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  server: {
    host: true,
    port: 3000
  },
  assetsInclude: ['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.gif']
}) 