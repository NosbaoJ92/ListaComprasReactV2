import { useState } from "react";
import { useTheme } from "../components/ThemeContext";
import SidebarMenu from "../components/SidebarMenu";

const PaginaBase = ({
  titulo = "Página Base",
  subtitulo = "Modelo de referência",
  usuarioLogado,
  onGoHome,
  onLogoutSuccess,
  onToggleModoNoturno,
  children, // conteúdo específico de cada página
}) => {
  const { modoNoturno, toggleModoNoturno } = useTheme();

  const isAdmin = usuarioLogado?.role === "admin";
  const userEmail = usuarioLogado?.email || "usuario@sistema.com";
  const userName =
    usuarioLogado?.name || (isAdmin ? "Administrador" : "Usuário");

  const [currentPage, setCurrentPage] = useState("pagina-base");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  // Logout
  const handleLogout = () => {
    if (onLogoutSuccess) {
      onLogoutSuccess();
    } else {
      alert("Sessão encerrada.");
    }
  };

  // Navegação
  const handleNavigation = (pageId) => {
    closeMenu();

    if (pageId === "home") {
      onGoHome?.();
      return;
    }

    if (pageId === "themeToggle") {
      if (onToggleModoNoturno) {
        onToggleModoNoturno();
      } else {
        toggleModoNoturno();
      }
      return;
    }

    if (pageId === "gestor" && !isAdmin) {
      alert("Acesso negado: apenas administradores.");
      return;
    }

    setCurrentPage(pageId);
  };

  // Menu padrão global
  const baseMenuOptions = [
  {
    id: 'home',
    label: 'Início',
    icon: '🏠',
    type: 'link',
    description: 'Voltar para a seleção de modo'
  },
  {
    id: 'gestor',
    label: 'Gestor EAN',
    icon: '📦',
    type: 'link',
    description: 'Gerenciar códigos de barras'
  },
  {
    id: 'base',
    label: 'Tela Base',
    icon: '⚙️',
    type: 'link',
    description: 'Tela base do sistema'
  },
  {
    id: 'lista',
    label: 'Lista Plan',
    icon: '📋',
    type: 'link',
    description: 'Tela de Lista Plan'
  },
  {
    id: 'themeToggle',
    label: 'Tema',
    icon: '🌙',
    type: 'toggleTheme',
    description: `Tema: ${modoNoturno ? 'Escuro' : 'Claro'}`
  }
  ];

  // Filtro admin
  const globalMenuOptions = baseMenuOptions.filter((item) => {
    if (item.id === "gestor" && !isAdmin) {
      return false;
    }
    return true;
  });

  // Dados da conta
  const userAccountInfo = {
    username: userName,
    email: userEmail,
    onLogout: handleLogout,
    isAdmin,
  };

  return (
    <div
      className={`min-h-screen w-full flex  ${
        modoNoturno
          ? "bg-gray-900 text-gray-100"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* Overlay mobile */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar */}
      <SidebarMenu
        menuItems={globalMenuOptions}
        accountInfo={userAccountInfo}
        activeLink={currentPage}
        onNavigate={handleNavigation}
        isMenuOpen={isMenuOpen}
        onClose={closeMenu}
      />

      {/* Conteúdo principal */}
      <main className="flex-grow px-4 sm:p-8 overflow-y-auto ">
        {/* Header Mobile */}
        <header className="flex items-center justify-between mb-8 md:hidden">
          <div className="fixed top-0 left-0 w-full z-20">
            <div
              className={`max-w-5xl mx-auto flex justify-between items-center py-4 px-4 shadow-md rounded-b-xl ${
                modoNoturno
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <button
                onClick={toggleMenu}
                className={`p-2 rounded-lg text-2xl ${
                  modoNoturno
                    ? "bg-gray-700 text-white"
                    : "bg-white text-gray-800"
                }`}
              >
                ☰
              </button>

              <h1 className="text-3xl sm:text-3xl lg:text-4xl font-extrabold">
                Tela Base do Sistema
              </h1>
               
              <div className="invisible">☰</div>
            </div>
          </div>
        </header>

        {/* Conteúdo Desktop + Área principal */}
        <div className="container mx-auto max-w-5xl pt-12 md:pt-0">
          {/* Título Desktop */}
          <div className="hidden md:block mb-8">
            <h1 className="text-4xl font-extrabold">
              Tela Base do Sistema
            </h1>
            <p className="text-sm opacity-70 mt-2">
              {subtitulo}
            </p>
          </div>

          {/* Card principal padrão */}
          <div
            className={`rounded-2xl shadow-lg border p-6 ${
              modoNoturno
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            {/* Aqui entra o conteúdo específico da página */}
            {children ? (
              children
            ) : (
              <div className="text-center py-16">
                <h2 className="text-2xl font-bold mb-2">
                  Estrutura Base
                </h2>
                <p className="opacity-70">
                  Utilize esta área para montar o conteúdo
                  específico da nova página.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaginaBase;