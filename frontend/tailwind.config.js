/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
        'background': '#f1f5f9',     // Corresponde a 'slate-100'
        'foreground': '#1e293b',     // Corresponde a 'slate-800'
        'muted': '#64748b',          // Corresponde a 'slate-500'
        'border-default': '#cbd5e1', // Corresponde a 'slate-300'
        'card': '#ffffff',           // Branco
        'success': '#059669',        // Corresponde a 'emerald-600'
        'danger': '#dc2626',         // Corresponde a 'red-600'
      }
    },
  },
  plugins: [
    // Plugin que melhora a estilização padrão de elementos de formulário.
    require('@tailwindcss/forms'),
  ],
}