import React, { useState } from 'react';
import { useTheme } from '../components/ThemeContext';
import SidebarMenu from '../components/SidebarMenu';

const TelaInicial = ({ onSelectOption, onLogoutSuccess, usuarioLogado }) => { 
 const isAdmin = usuarioLogado?.role === 'admin';
 const userEmail = usuarioLogado?.email || 'usuario@app.com';
 const userName = usuarioLogado?.name || (isAdmin ? "Admin Mestre" : "Usuário Comum");

 const [option, setOption] = useState('');
 const [subOption, setSubOption] = useState('');
 const [currentPage, setCurrentPage] = useState('home'); 
 const [isMenuOpen, setIsMenuOpen] = useState(false); 

 const { modoNoturno } = useTheme();

 const toggleMenu = () => setIsMenuOpen(prev => !prev);
 const closeMenu = () => setIsMenuOpen(false);

 const handleLogout = () => {
  if (onLogoutSuccess) {
    onLogoutSuccess(); 
  } else {
    alert("Sessão encerrada.");
  }
 };
 
 const baseMenuOptions = [
   { id: 'home', icon: '🏠', type: 'link', description: 'Voltar para a seleção de modo' },
    { id: 'gestor', icon: '📦', type: 'link', description: 'Gerenciar códigos de barras' },
    //   { id: 'settings', icon: '⚙️', type: 'link', description: 'Ajustes do sistema' },
    { id: 'themeToggle', icon: '🌙', type: 'toggleTheme', description: `Tema: ${modoNoturno ? 'Escuro' : 'Claro'}` },
 ];

 const globalMenuOptions = baseMenuOptions.filter(item => {
   if (item.id === 'gestor' && !isAdmin) return false;
   return true;
 });

 const userAccountInfo = {
   username: userName, 
   email: userEmail, 
   onLogout: handleLogout, 
   isAdmin: isAdmin, 
 };

 const handleMainOptionChange = (e) => { setOption(e.target.value); setSubOption(''); };
 const handleSubOptionChange = (e) => { setSubOption(e.target.value); };
 
 const handleConfirm = () => { 
  if (option === 'estipular' && !subOption) {
   alert('Por favor, selecione uma subopção para "Estipular valor".');
   return;
  }
  onSelectOption(option, subOption); 
 };
 
 const handleNavigation = (pageId) => { 
  if (pageId === 'gestor' && !isAdmin) {
   alert("Acesso negado.");
   return;
  }
  setCurrentPage(pageId); 
  closeMenu();
  if (pageId === 'gestor') { 
    onSelectOption('gestor', ''); 
  } else if (pageId === 'home') {
    onSelectOption('', '');
  }
 };
 
 const cardClasses = (currentOption) => {
  const isSelected = option === currentOption;
  const baseClasses = 'p-6 rounded-xl shadow-lg transition duration-300 ease-in-out border-2';
  if (modoNoturno) {
   return isSelected
    ? `${baseClasses} border-blue-500 bg-gray-700`
    : `${baseClasses} border-gray-700 bg-gray-800 hover:bg-gray-700`;
  } else {
   return isSelected
    ? `${baseClasses} border-blue-500 bg-white ring-2 ring-blue-500`
    : `${baseClasses} border-gray-200 bg-white hover:bg-gray-50`;
  }
 };

 const subOptionClasses = (currentSubOption) => {
  const isSelected = subOption === currentSubOption;
  const baseClasses = 'flex items-center p-3 rounded-lg transition duration-200 ease-in-out cursor-pointer';
  if (modoNoturno) {
   return isSelected
    ? `${baseClasses} bg-blue-600 text-white`
    : `${baseClasses} bg-gray-700 hover:bg-gray-600 text-gray-100`;
  } else {
   return isSelected
    ? `${baseClasses} bg-blue-500 text-white`
    : `${baseClasses} bg-gray-200 hover:bg-gray-300 text-gray-800`;
  }
 };

 const renderHomeContent = () => (
  <div className="flex flex-col h-full w-full max-w-xl mx-auto overflow-hidden">
    {/* Título - Fixo */}
    <div className="flex-shrink-0">
      <h1 className="py-4 text-center text-2xl sm:text-4xl font-extrabold">Bem-vindo à Lista de Compras - Online</h1>
    </div>

    {/* Área de Opções - Scroll Interno */}
    <div className="flex-grow overflow-y-auto px-2 relative">
      {/* Gradiente Superior */}
      <div className={`sticky top-0 h-4 z-10 w-full pointer-events-none ${modoNoturno ? 'bg-gradient-to-b from-gray-900' : 'bg-gradient-to-b from-gray-100'}`}></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
        <label className={cardClasses('lista')}>
          <input type="radio" value="lista" checked={option === 'lista'} onChange={handleMainOptionChange} className="hidden"/>
          <div className="flex flex-col items-center cursor-pointer">
            <span className="w-10 h-10 mb-2 flex items-center justify-center text-blue-500 font-bold text-3xl">📝</span>
            <p className="font-semibold text-xl">Criar Lista</p>
            <p className="text-center text-sm mt-1 opacity-75 text-xs">Planeje suas compras antes de ir ao mercado.</p>
          </div>
        </label>

        <label className={cardClasses('somar')}>
          <input type="radio" value="somar" checked={option === 'somar'} onChange={handleMainOptionChange} className="hidden"/>
          <div className="flex flex-col items-center cursor-pointer">
            <span className="w-8 h-8 mb-2 flex items-center justify-center text-blue-500 font-bold text-2xl">∑</span>
            <p className="font-semibold text-xl">Somar Valores</p>
            <p className="text-center text-sm mt-1 opacity-75 text-xs">Acompanhe o total gasto em tempo real.</p>
          </div>
        </label>

        <label className={cardClasses('estipular')}>
          <input type="radio" value="estipular" checked={option === 'estipular'} onChange={handleMainOptionChange} className="hidden"/>
          <div className="flex flex-col items-center cursor-pointer">
            <span className="w-8 h-8 mb-2 flex items-center justify-center text-blue-500 font-bold text-2xl">$</span>
            <p className="font-semibold text-xl">Estipular Valor</p>
            <p className="text-center text-sm mt-1 opacity-75 text-xs">Defina um limite de orçamento ou valor inicial.</p>
          </div>
        </label>
      </div>

      {option === 'estipular' && (
        <div className={`p-6 rounded-xl shadow-inner mb-4 ${modoNoturno ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h3 className="font-bold text-lg mb-4 text-center italic opacity-80">Tipo de Estipulação:</h3>
          <div className="flex flex-col space-y-3">
            <label className={subOptionClasses('subtrair')}>
              <input type="radio" value="subtrair" checked={subOption === 'subtrair'} onChange={handleSubOptionChange} className="mr-3 transform scale-125"/>
              Subtrair de um valor pré-definido
            </label>
            <label className={subOptionClasses('maximo')}>
              <input type="radio" value="maximo" checked={subOption === 'maximo'} onChange={handleSubOptionChange} className="mr-3 transform scale-125"/>
              Estipular valor máximo de gasto
            </label>
          </div>
        </div>
      )}

      {/* Gradiente Inferior */}
      <div className={`sticky bottom-0 h-4 z-10 w-full pointer-events-none ${modoNoturno ? 'bg-gradient-to-t from-gray-900' : 'bg-gradient-to-t from-gray-100'}`}></div>
    </div>

    {/* Botão de Confirmar - Fixo */}
    <div className="flex-shrink-0 py-4">
      <button
        onClick={handleConfirm}
        disabled={!option || (option === 'estipular' && !subOption)}
        className={`w-full py-4 text-xl font-bold rounded-lg transition duration-300 ease-in-out 
          ${(option && option !== 'estipular') || (option === 'estipular' && subOption) ? 'bg-green-600 text-white hover:bg-green-700 shadow-md' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
      >Confirmar</button>
      {option === 'estipular' && !subOption && (<p className="text-red-500 text-center mt-3 text-sm font-bold animate-pulse">*Selecione uma subopção para continuar.</p>)}
    </div>
  </div>
 );
 
 return (
  <div className={`h-screen w-full flex overflow-hidden ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
   {isMenuOpen && (
    <div className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" onClick={closeMenu} />
   )}

   <SidebarMenu
    menuItems={globalMenuOptions}
    accountInfo={userAccountInfo}
    activeLink={currentPage}
    onNavigate={handleNavigation}
    isMenuOpen={isMenuOpen} 
    onClose={closeMenu} 
   />

   <main className="flex-grow flex flex-col h-full p-4 sm:p-8 overflow-hidden">
    <header className="md:hidden flex-shrink-0 flex items-center justify-between mb-4">
      <button 
        onClick={toggleMenu} 
        className={`p-2 rounded-lg text-2xl ${modoNoturno ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
      > ☰ </button>
      <h1 className="invisible">
        {globalMenuOptions.find(item => item.id === currentPage)?.label || ' ComApppras'}
      </h1>
      <div className="w-8"></div>
    </header>

    <div className="flex-grow overflow-hidden"> 
      {currentPage === 'home' && renderHomeContent()}
      
      {currentPage === 'gestor' && (
        <div className="h-full overflow-y-auto">
          {isAdmin ? (
            <div className="text-center mt-16 italic"><h1>Gestor EAN - ADMIN APROVADO ✅</h1><p>Acesso total para gerenciar códigos de barras.</p></div>
          ) : (
            <div className="text-center mt-16 text-red-600 font-bold"><h1>Acesso Negado 🛑</h1></div>
          )}
        </div>
      )}
    </div>
   </main>
  </div>
 );
};

export default TelaInicial;