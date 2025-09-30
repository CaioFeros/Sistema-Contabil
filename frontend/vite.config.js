// vite.config.js (RECOMENDADO)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/ 
export default defineConfig(({ mode }) => {
 return {
  plugins: [react()],
  // A configuração CSS do PostCSS é geralmente desnecessária, pois o Vite
  // a detecta automaticamente se o postcss.config.js estiver na raiz.
  // Você pode remover a seção 'css' inteira, a menos que esteja tendo problemas.
 };
});