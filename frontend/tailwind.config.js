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
      colors: {
        'primary': {
          DEFAULT: '#0284c7', // Corresponde a 'sky-600'
          hover: '#0369a1'   // Corresponde a 'sky-700'
        },
        'secondary': {
          DEFAULT: '#4f46e5', // Corresponde a 'indigo-600'
          hover: '#4338ca'   // Corresponde a 'indigo-700'
        },
        'success': '#059669',        // Corresponde a 'emerald-600'
        'danger': '#dc2626',         // Corresponde a 'red-600'

        // Cores semânticas para o tema claro (light mode)
        'background': '#f1f5f9',     // slate-100
        'foreground': '#1e293b',     // slate-800
        'card': '#ffffff',           // white
        'card-foreground': '#1e293b',// slate-800
        'muted': '#64748b',          // slate-500
        'muted-foreground': '#f1f5f9',// slate-100
        'border-default': '#cbd5e1', // slate-300

        // Cores semânticas para o tema escuro (dark mode)
        'dark-background': '#0f172a',    // slate-900
        'dark-foreground': '#f1f5f9',    // slate-100
        'dark-card': '#1e293b',          // slate-800
        'dark-card-foreground': '#f1f5f9', // slate-100
        'dark-muted': '#334155',         // slate-700
        'dark-border-default': '#334155',// slate-700
      }
    },
  },
  plugins: [
    // Plugin que melhora a estilização padrão de elementos de formulário.
    require('@tailwindcss/forms'),
  ],
}