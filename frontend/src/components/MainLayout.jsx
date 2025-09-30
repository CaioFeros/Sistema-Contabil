import { Outlet, useNavigate } from 'react-router-dom';

// Futuramente, você pode adicionar uma Navbar ou Sidebar aqui.
const MainLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background min-h-screen text-foreground font-sans">
      {/* Exemplo de como adicionar um botão de voltar global ou um menu */}
      <header className="p-4 text-right">
        {/* Este é um exemplo, você pode remover ou adaptar */}
      </header>
      <main className="container mx-auto p-4 md:p-8">{<Outlet />}</main>
    </div>
  );
};

export default MainLayout;