import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout'; // 1. Importe o novo layout
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ClientesPage from './pages/ClientesPage';
import FaturamentoPage from './pages/FaturamentoPage';
import RelatoriosPage from './pages/RelatoriosPage';
 
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz redireciona para o login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rota pública de login */}
        <Route path="/login" element={<LoginPage />} />
 
        {/* Rotas protegidas que usarão o MainLayout */}
        {/* O path foi alterado de "/" para "/app" para evitar conflito com a rota raiz */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* A rota "/" dentro do layout redireciona para o dashboard */}
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} /> 
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="faturamento" element={<FaturamentoPage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />
        </Route>
 
        {/* Rota para páginas não encontradas */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
