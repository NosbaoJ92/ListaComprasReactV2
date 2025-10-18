import React, { useState } from 'react';
import { useTheme } from '../components/ThemeContext';
import SidebarMenu from '../components/SidebarMenu'; // 

/**
 * Tela principal do sistema após o login.
 * 🔑 AJUSTE: usuarioLogado agora é um OBJETO: { role: 'admin'/'usuario', email: '...', name: '...' }
 * @param {object} usuarioLogado - Objeto com informações do usuário logado, passado pelo App.jsx.
 * @param {function(string, string): void} onSelectOption - Função para navegar para a tela de funcionalidade (App.jsx).
 * @param {function(): void} onLogoutSuccess - A função de logout REAL, passada pelo App.jsx.
 */
const TelaInicial = ({ onSelectOption, onLogoutSuccess, usuarioLogado }) => { 
 // --- 🔑 AJUSTE: LENDO DADOS DO OBJETO usuarioLogado ---
 // Define isAdmin baseado na 'role' do objeto. Se o objeto for null (o que não deve acontecer aqui), assume-se 'usuario'.
 const isAdmin = usuarioLogado?.role === 'admin';
 const userEmail = usuarioLogado?.email || 'usuario@sistema.com';
 const userName = usuarioLogado?.name || (isAdmin ? "Admin Mestre" : "Usuário Comum");

 // --- Estados de Lógica de Tela ---
 const [option, setOption] = useState('');
 const [subOption, setSubOption] = useState('');
 const [currentPage, setCurrentPage] = useState('home'); 
 const [isMenuOpen, setIsMenuOpen] = useState(false); 

 const { modoNoturno } = useTheme();

 const toggleMenu = () => setIsMenuOpen(prev => !prev);
 const closeMenu = () => setIsMenuOpen(false);

 // --- Funções de Logout ---
 const handleLogout = () => {
  console.log("Saindo do sistema...");
  
  // Chama a função que limpa o estado de login no App.jsx
  if (onLogoutSuccess) {
    onLogoutSuccess(); 
  } else {
    alert("Sessão encerrada. (Faltando a função onLogoutSuccess do componente pai)");
  }
 };
 
 // --- Estrutura de Opções base ---
 const baseMenuOptions = [
  { id: 'home', icon: '🏠', type: 'link', description: 'Voltar para a seleção de modo' },
  { id: 'gestor', icon: '📦', type: 'link', description: 'Gerenciar códigos de barras' },
  { id: 'settings', icon: '⚙️', type: 'link', description: 'Ajustes do sistema' },
  { id: 'themeToggle', icon: '🌙', type: 'toggleTheme', description: `Tema: ${modoNoturno ? 'Escuro' : 'Claro'}` },
 ];

 // FILTRAGEM DO MENU: Aplica a restrição de ADMIN
 const globalMenuOptions = baseMenuOptions.filter(item => {
   // Se o item for 'gestor' E o usuário NÃO for admin, ele é filtrado (removido).
   if (item.id === 'gestor' && !isAdmin) {
     return false;
   }
   return true;
 });

 // --- Informações da Conta (Para o rodapé do SidebarMenu)
 const userAccountInfo = {
   username: userName, 
   email: userEmail, 
   onLogout: handleLogout, 
   isAdmin: isAdmin, 
 };

 // --- Funções de Lógica e Estilo---
 const handleMainOptionChange = (e) => { setOption(e.target.value); setSubOption(''); };
 const handleSubOptionChange = (e) => { setSubOption(e.target.value); };
 
 const handleConfirm = () => { 
  if (option === 'estipular' && !subOption) {
   alert('Por favor, selecione uma subopção para "Estipular valor".');
   return;
  }
  onSelectOption(option, subOption); 
 };
 
 // VALIDAÇÃO DE NAVEGAÇÃO (Mantida e Melhorada)
 const handleNavigation = (pageId) => { 
  // 1. Validação de acesso à tela do Gestor
  if (pageId === 'gestor' && !isAdmin) {
   alert("Acesso negado: Você não tem permissão de administrador para o Gestor EAN.");
   return; // Bloqueia a navegação
  }
  
  // 2. Continua a navegação
  setCurrentPage(pageId); 
    closeMenu(); // Fecha o menu em mobile

  // 3. Avisa ao App.jsx para renderizar o componente (se necessário)
  if (pageId === 'gestor') { 
    onSelectOption('gestor', ''); 
  } else if (pageId === 'home') {
        onSelectOption('', ''); // Volta para a seleção inicial do App.jsx
    }
 };
 
 // ... (cardClasses e subOptionClasses permanecem iguais) ...
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
  <div className="w-full max-w-xl mx-auto">
   <h1 className="py-4 text-center text-4xl font-extrabold mb-10">Bem-vindo à Lista de Compras - Online</h1>
   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
    <label className={cardClasses('somar')}>
     <input type="radio" value="somar" checked={option === 'somar'} onChange={handleMainOptionChange} className="hidden"/>
     <div className="flex flex-col items-center cursor-pointer">
      <span className="w-8 h-8 mb-2 flex items-center justify-center text-blue-500 font-bold text-2xl">∑</span>
      <p className="font-semibold text-xl">Somar Valores</p>
      <p className="text-center text-sm mt-1 opacity-75">Acompanhe o total gasto em tempo real.</p>
     </div>
    </label>
    <label className={cardClasses('estipular')}>
     <input type="radio" value="estipular" checked={option === 'estipular'} onChange={handleMainOptionChange} className="hidden"/>
     <div className="flex flex-col items-center cursor-pointer">
      <span className="w-8 h-8 mb-2 flex items-center justify-center text-blue-500 font-bold text-2xl">$</span>
      <p className="font-semibold text-xl">Estipular Valor</p>
      <p className="text-center text-sm mt-1 opacity-75">Defina um limite de orçamento ou um valor inicial.</p>
     </div>
    </label>
   </div>
   {option === 'estipular' && (
    <div className={`p-6 rounded-xl shadow-inner mb-8 ${modoNoturno ? 'bg-gray-700' : 'bg-gray-50'}`}>
     <h3 className="font-bold text-lg mb-4 text-center">Selecione o tipo de Estipulação:</h3>
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
   <button
    onClick={handleConfirm}
    disabled={!option || (option === 'estipular' && !subOption)}
    className={`w-full py-4 text-xl font-bold rounded-lg transition duration-300 ease-in-out 
     ${option || (option === 'estipular' && subOption) ? 'bg-green-600 text-white hover:bg-green-700 shadow-md' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
   >Confirmar</button>
   {option === 'estipular' && !subOption && (<p className="text-red-500 text-center mt-3 text-sm">*Selecione uma subopção para continuar.</p>)}
  </div>
 );
 
 // --- Componente Principal (Layout Flex) ---
 return (
  <div className={`min-h-screen w-full flex ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>

   {/* Overlay de fundo para mobile quando o menu está aberto */}
   {isMenuOpen && (
    <div 
     className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
     onClick={closeMenu}
    />
   )}

   {/* 1. Menu Lateral (SidebarMenu) */}
   <SidebarMenu
    menuItems={globalMenuOptions} // Lista FILTRADA
    accountInfo={userAccountInfo} // Infos da Conta (inclui isAdmin, name e email REAIS)
    activeLink={currentPage}
    onNavigate={handleNavigation}
    isMenuOpen={isMenuOpen} 
    onClose={closeMenu} 
   />

   {/* 2. Conteúdo Principal */}
   <main className="flex-grow p-4 sm:p-8 overflow-y-auto">
    
    {/* Header/Barra para Mobile com Botão de Menu */}
    <header className="md:hidden flex items-center justify-between mb-8">
      <button 
        onClick={toggleMenu} 
        className={`p-2 rounded-lg text-2xl ${modoNoturno ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
      >
        ☰
      </button>
      <h1 className="text-xl font-bold">
        {globalMenuOptions.find(item => item.id === currentPage)?.label || 'Sistema'}
      </h1>
      <div className="w-8"></div>
    </header>

    {/* Renderiza o conteúdo da página ativa */}
    <div className="mt-4 md:mt-0"> 
      {currentPage === 'home' && renderHomeContent()}
      {currentPage === 'settings' && <div className="text-center mt-16"><h1>Tela de Configurações (em construção)</h1></div>}
      
      {/* Validação de Renderização da Tela Gestor */}
      {currentPage === 'gestor' && (
        isAdmin ? (
          <div className="text-center mt-16"><h1>Gestor EAN - ADMIN APROVADO ✅</h1><p>Acesso total para gerenciar códigos de barras.</p></div>
        ) : (
          <div className="text-center mt-16 text-red-600"><h1>Acesso Negado 🛑</h1><p>Esta funcionalidade é exclusiva para administradores.</p></div>
        )
      )}
    </div>
    
   </main>

  </div>
 );
};

export default TelaInicial;