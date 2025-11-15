import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sassAliasPlugin = () => {
  return {
    name: 'sass-alias-resolver',
    enforce: 'pre',
    transform(code, id) {
      if ((id.endsWith('.scss') || id.endsWith('.sass')) && code.includes('@/')) {
        try {
          const srcPath = resolve(__dirname, './src');
          const filePath = id.split('?')[0]; 
          
          if (filePath.startsWith(srcPath)) {
            const relativePath = filePath.replace(srcPath, '').replace(/\\/g, '/');
            const depth = (relativePath.match(/\//g) || []).length - 1;
            const backPath = depth > 0 ? '../'.repeat(depth) : './';
            
            const transformedCode = code.replace(/@\/styles\//g, `${backPath}styles/`);
            return transformedCode;
          }
        } catch (e) {
          console.error('Error in sass-alias-resolver:', e);
        }
      }
      return null;
    },
  };
};

export default defineConfig({
  plugins: [react(), sassAliasPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api'],
        includePaths: [resolve(__dirname, './src')],
      },
    },
  },
  server: {
    port: 3000,
  },
});