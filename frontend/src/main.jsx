import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Importa o componente principal do App
import './index.css'; // Importa os estilos do Tailwind
import { AuthProvider } from './context/AuthContext.jsx'; // O AuthContext já gerencia o token do Axios

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);