// SidebarMenu.jsx
import React from 'react';
import { useTheme } from './ThemeContext';

const SidebarMenu = ({
  menuItems = [],
  activeLink,
  onNavigate,
  isMenuOpen = false,
  onClose,
  accountInfo = {},
}) => {
  const { modoNoturno, toggleModoNoturno } = useTheme();

  const usuarioNome = accountInfo?.username || 'Usuário';
  const usuarioEmail = accountInfo?.email || 'usuario@app.com';
  const isAdmin = Boolean(accountInfo?.isAdmin);
  const primeiraLetra = usuarioNome?.charAt(0)?.toUpperCase() || 'U';

  const handleItemClick = (item) => {
    if (!item) return;

    if (item.type === 'toggleTheme') {
      toggleModoNoturno();
    } else {
      onNavigate?.(item.id);
    }

    onClose?.();
  };

  const getItemTitle = (item) => {
    if (item.label) return item.label;

    if (item.id === 'home') return 'Início';
    if (item.id === 'gestor') return 'Gestor';
    if (item.id === 'lista') return 'Lista';
    if (item.id === 'somar') return 'Somar';
    if (item.id === 'estipular') return 'Orçamento';
    if (item.id === 'themeToggle') return 'Tema';

    return item.description || 'Menu';
  };

  const getItemDescription = (item) => {
    if (item.type === 'toggleTheme') {
      return `Tema: ${modoNoturno ? 'Escuro' : 'Claro'}`;
    }

    return item.description || '';
  };

  const getItemIcon = (item) => {
    if (item.type === 'toggleTheme') {
      return modoNoturno ? '☀️' : '🌙';
    }

    return item.icon || '•';
  };

  const optionClasses = (item) => {
    const isActive = activeLink === item.id;

    const baseClasses = `
      group w-full flex items-center gap-3 rounded-2xl px-3 py-3
      transition-all duration-200 text-left
      focus:outline-none focus:ring-2 focus:ring-blue-500/40
    `;

    if (modoNoturno) {
      return isActive
        ? `${baseClasses} bg-blue-600/20 text-white border border-blue-500/40 shadow-sm`
        : `${baseClasses} bg-transparent text-gray-300 border border-transparent hover:bg-gray-700/70 hover:text-white`;
    }

    return isActive
      ? `${baseClasses} bg-blue-50 text-blue-800 border border-blue-200 shadow-sm`
      : `${baseClasses} bg-transparent text-gray-700 border border-transparent hover:bg-gray-100 hover:text-gray-900`;
  };

  const iconClasses = (item) => {
    const isActive = activeLink === item.id;

    if (item.type === 'toggleTheme') {
      return modoNoturno
        ? 'bg-yellow-500/15 text-yellow-300'
        : 'bg-yellow-100 text-yellow-700';
    }

    if (isActive) {
      return modoNoturno
        ? 'bg-blue-500 text-white'
        : 'bg-blue-600 text-white';
    }

    return modoNoturno
      ? 'bg-gray-700 text-gray-200 group-hover:bg-gray-600'
      : 'bg-gray-100 text-gray-700 group-hover:bg-white';
  };

  const sidebarClasses = `
    fixed top-0 left-0 z-40 h-screen w-72 max-w-[85vw]
    flex flex-col overflow-hidden
    transition-transform duration-300 ease-in-out
    ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
    md:relative md:translate-x-0 md:w-72 md:max-w-none
    ${
      modoNoturno
        ? 'bg-gray-800 text-gray-100 border-r border-gray-700'
        : 'bg-white text-gray-900 border-r border-gray-200'
    }
  `;

  return (
    <aside className={sidebarClasses}>
      <div
        className={`
          flex-shrink-0 px-5 py-5 border-b
          ${modoNoturno ? 'border-gray-700' : 'border-gray-200'}
        `}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-tight">
              Menu Principal
            </h2>

            <p
              className={`
                text-xs mt-1 font-medium
                ${modoNoturno ? 'text-gray-400' : 'text-gray-500'}
              `}
            >
              Navegação do sistema
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`
              md:hidden w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition
              ${
                modoNoturno
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }
            `}
            aria-label="Fechar menu"
          >
            ×
          </button>
        </div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-4 custom-scrollbar">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const isActive = activeLink === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={optionClasses(item)}
                onClick={() => handleItemClick(item)}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className={`
                    w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 transition
                    ${iconClasses(item)}
                  `}
                >
                  {getItemIcon(item)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-black text-sm truncate">
                    {getItemTitle(item)}
                  </p>

                  {getItemDescription(item) && (
                    <p
                      className={`
                        text-xs mt-0.5 line-clamp-2
                        ${modoNoturno ? 'text-gray-400' : 'text-gray-500'}
                      `}
                    >
                      {getItemDescription(item)}
                    </p>
                  )}
                </div>

                {isActive && (
                  <span
                    className={`
                      w-2 h-8 rounded-full flex-shrink-0
                      ${modoNoturno ? 'bg-blue-400' : 'bg-blue-600'}
                    `}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div
        className={`
          flex-shrink-0 px-4 py-4 border-t
          ${modoNoturno ? 'border-gray-700' : 'border-gray-200'}
        `}
      >
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-3">
            <p
              className={`
                text-xs font-black uppercase tracking-wide
                ${modoNoturno ? 'text-gray-400' : 'text-gray-500'}
              `}
            >
              Conta
            </p>

            {isAdmin && (
              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                ADMIN
              </span>
            )}
          </div>

          <div
            className={`
              rounded-2xl p-3 flex items-center gap-3
              ${modoNoturno ? 'bg-gray-900/70' : 'bg-gray-50'}
            `}
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
              {primeiraLetra}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black truncate">
                {usuarioNome}
              </p>

              <p
                className={`
                  text-xs truncate
                  ${modoNoturno ? 'text-gray-400' : 'text-gray-500'}
                `}
              >
                {usuarioEmail}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={accountInfo?.onLogout}
          className="
            w-full h-11 rounded-2xl bg-red-600 hover:bg-red-700
            text-white text-sm font-black transition-all active:scale-95
            flex items-center justify-center gap-2
          "
        >
          <span>🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default SidebarMenu;