import React, { useState, useMemo, useRef } from 'react';
import SidebarMenu from '../components/SidebarMenu';

const ListaPlan = ({ 
  items = [], 
  setItems, 
  onGoHome, 
  modoNoturno, 
  usuarioLogado, 
  onLogoutSuccess,
  onSelectOption 
}) => {
  const [newItem, setNewItem] = useState('');
  const [qty, setQty] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFinalizeOptions, setShowFinalizeOptions] = useState(false);
  const [exibirModalConfirmacao, setExibirModalConfirmacao] = useState(false);
  const inputRef = useRef(null);

  const isAdmin = usuarioLogado?.role === 'admin';

  // Alinhado com o padrão da TelaInicial
  const baseMenuOptions = [
    { id: 'home', icon: '🏠', type: 'link', description: 'Voltar para o Início' },
    { id: 'gestor', icon: '📦', type: 'link', description: 'Gerenciar Produtos' },
    // { id: 'lista', icon: '📝', type: 'link', description: 'Tela de Lista Plan' },
    { id: 'themeToggle', icon: '🌙', type: 'toggleTheme', description: `Tema: ${modoNoturno ? 'Escuro' : 'Claro'}` },
  ];

  const globalMenuOptions = baseMenuOptions.filter(item => {
    if (item.id === 'gestor' && !isAdmin) return false;
    return true;
  });

  const userAccountInfo = {
    username: usuarioLogado?.name || "Usuário",
    email: usuarioLogado?.email || "usuario@app.com",
    onLogout: onLogoutSuccess,
    isAdmin: isAdmin,
  };

  // --- LÓGICAS ---
  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  const handleNavigation = (pageId) => {
    if (pageId === 'home') onGoHome();
    else if (pageId === 'gestor' && !isAdmin) alert("Acesso negado.");
    else if (pageId === 'gestor') onSelectOption('gestor', '');
    closeMenu();
  };

  const addItem = (e) => {
    e?.preventDefault();
    const trimmedName = newItem.trim();
    if (!trimmedName) return;
    
    const item = { 
      id: Date.now(), 
      nome: trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1), 
      quantidade: Number(qty) || 1, 
      valor: 0, 
      total: 0, 
      checked: false 
    };
    
    setItems([item, ...items]);
    setNewItem('');
    setQty(1);
    inputRef.current?.focus();
  };

  const finalizarParaCompra = (metodo, subtipo = '') => {
      onSelectOption(metodo, subtipo, items);
      setShowFinalizeOptions(false);
  };

  return (
    <div className={`h-screen w-full flex overflow-hidden ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      
      {/* Overlay para Mobile */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" onClick={closeMenu} />
      )}

      <SidebarMenu
        menuItems={globalMenuOptions}
        accountInfo={userAccountInfo}
        activeLink="lista"
        onNavigate={handleNavigation}
        isMenuOpen={isMenuOpen}
        onClose={closeMenu}
      />

      <main className="flex-grow flex flex-col h-full p-4 sm:p-8 overflow-hidden relative">
        {/* Header Mobile - Idêntico à TelaInicial */}
        <header className={`md:hidden flex-shrink-0 flex items-center justify-between p-4 fixed top-0 left-0 w-full z-20 shadow-md rounded-b-xl ${
                            modoNoturno
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-900'
                        }`}>
          <button 
            onClick={toggleMenu} 
            className={`p-2 rounded-lg text-2xl ${modoNoturno ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
          > ☰ </button>
          <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold">Planejamento 🛒</h1>
              <p className="opacity-60 text-xs font-bold uppercase tracking-widest">Monte sua lista</p>
            </div>
          <div className="w-8"></div>
        </header>

        {/* Conteúdo com Scroll Interno */}
        <div className="flex-grow flex flex-col max-w-2xl mx-auto w-full overflow-hidden mt-20"> 
          {/* Form fixo no topo da área de conteúdo */}
          <div className={`flex-shrink-0 p-4 rounded-2xl shadow-lg mb-6 border-2 ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <form onSubmit={addItem} className="flex flex-col gap-3">
              <input 
                ref={inputRef}
                type="text" 
                placeholder="O que você precisa?" 
                className={`p-4 rounded-xl outline-none font-medium transition ${modoNoturno ? 'bg-gray-900 focus:ring-2 ring-blue-500' : 'bg-gray-100 focus:ring-2 ring-blue-400'}`}
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
              />
              <div className="flex gap-2">
                <input 
                  type="number"
                  className={`w-20 p-4 rounded-xl text-center font-bold ${modoNoturno ? 'bg-gray-700' : 'bg-gray-100'}`}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
                <button type="submit" className="flex-grow bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all active:scale-95">
                  Adicionar
                </button>
              </div>
            </form>
          </div>

          {/* Área de itens com Scroll */}
          <div className="flex-grow overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 italic">
                <p>Nenhum item adicionado...</p>
              </div>
            ) : (
              items.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    modoNoturno ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 font-black">
                      {item.quantidade}
                    </span>
                    <span className="font-bold text-lg">{item.nome}</span>
                  </div>
                  <button 
                    onClick={() => setItems(items.filter(i => i.id !== item.id))}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
            {/* Espaçamento para o botão flutuante não cobrir o último item */}
            <div className="h-24"></div>
          </div>
        </div>
        <div className="flex-shrink-0 flex justify-end items-end mt-4">
            {items.length > 0 && (
              <button 
                onClick={() => setExibirModalConfirmacao(true)}
                className="text-xs font-bold bg-red-700 text-white hover:underline px-2 py-1"
              >LIMPAR TUDO</button>
            )}
          </div>

        {/* Botão de Finalização Fixo no Rodapé */}
        {items.length > 0 && (
          <div className="flex-shrink-0 pt-4 max-w-2xl mx-auto w-full">
            <button 
              onClick={() => setShowFinalizeOptions(true)}
              className="w-full py-5 bg-green-600 hover:bg-green-700 text-white text-xl font-black rounded-2xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3"
            >
              IR PARA O MERCADO 
              {/* ({items.length}) */}
              <span className="text-2xl">➔</span>
            </button>
          </div>
        )}
      </main>

      {/* Modais (Finalização e Confirmação) - Mantendo a lógica de portais/overlays */}
      {showFinalizeOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-sm p-8 rounded-[2rem] ${modoNoturno ? 'bg-gray-800' : 'bg-white'}`}>
             <h3 className="text-2xl font-black mb-6 text-center">Como deseja comprar?</h3>
             <div className="grid gap-4">
                <button onClick={() => finalizarParaCompra('somar')} className="p-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors">🛒 Somar Carrinho</button>
                <button onClick={() => finalizarParaCompra('estipular', 'subtrair')} className="p-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-colors">💰 Respeitar Orçamento</button>
                <button onClick={() => setShowFinalizeOptions(false)} className="mt-2 font-bold opacity-50">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {exibirModalConfirmacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-xs p-8 rounded-[2rem] text-center ${modoNoturno ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className="text-xl font-black mb-6">Limpar toda a lista?</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setItems([]); setExibirModalConfirmacao(false); }} className="p-4 bg-red-500 text-white rounded-xl font-bold">Sim, zerar tudo</button>
              <button onClick={() => setExibirModalConfirmacao(false)} className="p-4 font-bold opacity-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaPlan;