// SidebarMenu.jsx
import React from 'react';
// Importe o ThemeContext para acessar o modoNoturno e toggleModoNoturno
import { useTheme } from './ThemeContext'; 
// ... (JSDoc do componente permanece o mesmo) ...

const SidebarMenu = ({
  menuItems,
  activeLink, 
  onNavigate,
  isMenuOpen, 
  onClose,
  accountInfo, // Recebe as informações da conta
}) => {
  const { modoNoturno, toggleModoNoturno } = useTheme(); 

  // --- Classes de Estilização para Itens de Menu ---
  const optionClasses = (itemId) => {
    const isActive = activeLink === itemId;
    const baseClasses = 'p-4 rounded-lg cursor-pointer transition duration-300 ease-in-out flex items-start space-x-3';
    
    if (modoNoturno) {
      return isActive
        ? `${baseClasses} border-l-4 border-blue-500 bg-gray-700 text-white shadow-md`
        : `${baseClasses} border-l-4 border-transparent bg-gray-800 text-gray-200 hover:bg-gray-700`;
    } else {
      return isActive
        ? `${baseClasses} border-l-4 border-blue-600 bg-blue-50 text-blue-800 font-semibold shadow-inner`
        : `${baseClasses} border-l-4 border-transparent bg-white text-gray-800 hover:bg-gray-50`;
    }
  };

  // --- Handler de Clique em Item ---
  const handleItemClick = (item) => {
    if (item.type === 'toggleTheme') {
      toggleModoNoturno(); 
    } else {
      onNavigate(item.id);
    }
    // Fecha o menu em mobile após a seleção
    if (onClose) {
        onClose();
    }
  };

  // --- Classes de Responsividade OTIMIZADAS ---
  const menuContainerClasses = `
    h-screen w-64 p-4 flex-shrink-0 shadow-xl 
    transition-transform duration-300 z-40 
    
    flex flex-col justify-between 
    
    ${modoNoturno ? 'bg-gray-800' : 'bg-white border-r border-gray-200'}
    
    fixed top-0 left-0 
    ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
    
    md:relative md:translate-x-0 md:block md:flex
  `;

  return (
    <div className={menuContainerClasses}>
        {/* 1. SEÇÃO PRINCIPAL (Menus de Navegação) */}
        <div className="flex-grow overflow-y-auto mb-4">
            <h2 className={`text-2xl text-center font-bold mb-6 ${modoNoturno ? 'text-white' : 'text-gray-900'}`}>
                Menu Principal
            </h2>
            <nav className="space-y-2">
            {menuItems.map((item) => (
                <div 
                key={item.id} 
                className={optionClasses(item.id)}
                onClick={() => handleItemClick(item)}
                role="button"
                tabIndex="0"
                >
                <div className={`text-2xl font-bold 
                    ${activeLink === item.id ? 'text-blue-500' : (item.type === 'toggleTheme' ? 'text-yellow-500' : 'text-gray-500')}`}>
                    {item.type === 'toggleTheme' ? (modoNoturno ? '☀️' : '🌙') : item.icon}
                </div>
                <div>
                    <p className="font-semibold text-base">{item.label}</p>
                    <p className="text-xs opacity-75">{item.description}</p>
                </div>
                </div>
            ))}
            </nav>
        </div>

        {/* 2. SEÇÃO DE CONTA (Rodapé) */}
        <div className={`mt-auto pt-4 border-t ${modoNoturno ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`font-bold text-sm mb-2 ${modoNoturno ? 'text-gray-400' : 'text-gray-600'}`}>
                Conta 
                {accountInfo.isAdmin && <span className="text-blue-500 font-bold ml-2">(ADMIN)</span>}
            </h3>
            
            {/* Informações da Conta (Nome e Email) */}
            <div className="p-3 rounded-lg flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {accountInfo.username.charAt(0)}
                </div>
                <div>
                    <p className="text-sm font-semibold">{accountInfo.username}</p>
                    <p className="text-xs opacity-75">{accountInfo.email}</p>
                </div>
            </div>

            {/* Botão Sair/Logout */}
            <button
                onClick={accountInfo.onLogout} // Esta função fará a mudança para o Login.jsx
                className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-300 flex items-center justify-center space-x-2 ${
                    modoNoturno ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
            >
                <span>Sair</span>
            </button>
        </div>
    </div>
  );
};

export default SidebarMenu;