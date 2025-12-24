// src/components/AppLayout.jsx
import React, { useState } from "react";
import SidebarMenu from "./SidebarMenu";

/**
 * Layout global que contém o SidebarMenu e o conteúdo das páginas.
 * Exibe o mesmo menu em todas as telas.
 */
const AppLayout = ({ children, usuarioLogado, onNavigate, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("home");

  const handleNavigate = (pageId) => {
    setActiveLink(pageId);
    onNavigate(pageId);
  };

  const accountInfo = {
    username: usuarioLogado?.email?.split("@")[0] || "Usuário",
    email: usuarioLogado?.email || "sem@email.com",
    isAdmin: usuarioLogado?.role === "admin",
    onLogout,
  };

  // Itens do menu (fixos e reaproveitados em todas as telas)
  const menuItems = [
    { id: "home", label: "Início", description: "Página inicial", icon: "🏠" },
    { id: "gestor", label: "Gestor EAN", description: "Área de administração", icon: "📦" },
    { id: "settings", label: "Configurações", description: "Preferências", icon: "⚙️" },
    { id: "toggleTheme", label: "Modo Noturno", description: "Alternar tema", type: "toggleTheme" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar global */}
      <SidebarMenu
        menuItems={menuItems}
        activeLink={activeLink}
        onNavigate={handleNavigate}
        isMenuOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        accountInfo={accountInfo}
      />

      {/* Conteúdo da tela */}
      <div className="flex-1 flex flex-col">
        {/* Cabeçalho simples */}
        <header
          className={`p-4 shadow-md flex items-center justify-between ${
            usuarioLogado?.modoNoturno ? "bg-gray-800 text-white" : "bg-white"
          }`}
        >
          <button
            className="md:hidden text-2xl font-bold"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            ☰
          </button>
          <h1 className="text-lg font-bold">
            {activeLink === "gestor" && accountInfo.isAdmin
              ? "Gestor EAN (Admin)"
              : activeLink === "settings"
              ? "Configurações"
              : "Página Inicial"}
          </h1>
        </header>

        {/* Área principal de conteúdo */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
