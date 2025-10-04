import { Outlet, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';

// Futuramente, você pode adicionar uma Navbar ou Sidebar aqui.
const MainLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Remove o token do localStorage
    localStorage.removeItem('authToken');
    // 2. Redireciona o usuário para a página de login
    navigate('/login', { replace: true });
  };

  return (
    <div className="bg-background dark:bg-dark-background min-h-screen text-foreground dark:text-dark-foreground font-sans transition-colors duration-200">
      {/* Header com os botões */}
      <header className="container mx-auto p-4 flex justify-end items-center">
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="px-3 py-1 rounded-md text-muted hover:bg-border-default dark:hover:bg-dark-border-default transition-colors"
          >
            Sair
          </button>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">{<Outlet />}</main>
    </div>
  );
};

export default MainLayout;