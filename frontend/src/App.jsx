import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import GerenciarClientes from './pages/GerenciarClientes';
import FaturamentoPage from './pages/FaturamentoPage';
import RelatoriosPage from './pages/RelatoriosPage';
import GerenciarUsuarios from './pages/GerenciarUsuarios';
import HistoricoLogs from './pages/HistoricoLogs';
import HistoricoAtividades from './pages/HistoricoAtividades';
import GerenciarContador from './pages/GerenciarContador';
import EmissaoRecibo from './pages/EmissaoRecibo';
import ConsultaCNAE from './pages/ConsultaCNAE';
import ContratosPage from './pages/ContratosPage';
import { ThemeProvider } from './context/ThemeContext';

 
function App() {
  return (
    <ThemeProvider>
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
            <Route path="clientes" element={<GerenciarClientes />} />
            <Route path="faturamento" element={<FaturamentoPage />} />
            <Route path="relatorios" element={<RelatoriosPage />} />
            <Route path="recibos" element={<EmissaoRecibo />} />
            <Route path="gerenciar-contador" element={<GerenciarContador />} />
            <Route path="cnae" element={<ConsultaCNAE />} />
            <Route path="contratos" element={<ContratosPage />} />
            
                {/* Rotas de Administração */}
                <Route path="admin/usuarios" element={<GerenciarUsuarios />} />
                <Route path="admin/logs" element={<HistoricoLogs />} />
                <Route path="admin/atividades" element={<HistoricoAtividades />} />
              </Route>
   
          {/* Rota para páginas não encontradas */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
