import { themeColors } from './src/config/themeColors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Habilita a estratégia de tema escuro por classe
  theme: {
    // Ao usar 'extend', você adiciona suas customizações ao tema padrão do Tailwind,
    // em vez de substituí-lo. Isso preserva os breakpoints, animações e outras utilidades.
    extend: {
      // Importa as cores do nosso arquivo central
      colors: {
        ...themeColors,
        // Cores que não precisam estar nos gráficos podem continuar aqui
        'card': '#ffffff',           // white
        'card-foreground': '#1e293b',// slate-800
        'muted': '#64748b',          // slate-500
        'muted-foreground': '#f1f5f9',// slate-100
        'dark-card': '#1e293b',          // slate-800
        'dark-card-foreground': '#f1f5f9', // slate-100
        'dark-muted': '#334155',         // slate-700
      }
    },
  },
  plugins: [
    // Plugin que melhora a estilização padrão de elementos de formulário.
    require('@tailwindcss/forms'),
  ],
}