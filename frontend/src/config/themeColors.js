/**
 * Fonte única da verdade para as cores do tema.
 * Usado tanto pelo tailwind.config.js quanto pelos componentes da aplicação (ex: gráficos).
 */
export const themeColors = {
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
  'border-default': '#cbd5e1', // slate-300

  // Cores semânticas para o tema escuro (dark mode)
  'dark-background': '#0f172a',    // slate-900
  'dark-foreground': '#f1f5f9',    // slate-100
  'dark-border-default': '#334155',// slate-700
};