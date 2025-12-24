import React, { useState } from 'react';
import SidebarMenu from '../components/SidebarMenu';

const ListaPlan = ({ 
  items = [], 
  setItems, 
  onGoHome, 
  modoNoturno, 
  usuarioLogado, 
  onLogoutSuccess,
  onSelectOption // Função do App.jsx para trocar de tela
}) => {
  const [newItem, setNewItem] = useState('');
  const [qty, setQty] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFinalizeOptions, setShowFinalizeOptions] = useState(false);

  const isAdmin = usuarioLogado?.role === 'admin';

  // Configuração do Menu Lateral (Igual à Tela Inicial para manter consistência)
  const globalMenuOptions = [
     { id: 'home', icon: '🏠', type: 'link', description: 'Voltar para a seleção de modo' },
  { id: 'gestor', icon: '📦', type: 'link', description: 'Gerenciar códigos de barras' },
//   { id: 'settings', icon: '⚙️', type: 'link', description: 'Ajustes do sistema' },
  { id: 'themeToggle', icon: '🌙', type: 'toggleTheme', description: `Tema: ${modoNoturno ? 'Escuro' : 'Claro'}` },
  ].filter(item => item.id !== 'gestor' || isAdmin);

  const userAccountInfo = {
    username: usuarioLogado?.name || "Usuário",
    email: usuarioLogado?.email || "",
    onLogout: onLogoutSuccess,
    isAdmin: isAdmin,
  };

  const handleNavigation = (pageId) => {
    if (pageId === 'home') onGoHome();
    else onSelectOption(pageId, '');
    setIsMenuOpen(false);
  };

  const addItem = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const item = { id: Date.now(), name: newItem, quantity: qty, price: 0, checked: false };
    setItems([...items, item]);
    setNewItem('');
    setQty(1);
  };


  const removeItem = (id) => setItems(items.filter(i => i.id !== id));

  return (
    <div className={`flex min-h-screen w-full ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      
      {/* 1. Barra Lateral */}
      <SidebarMenu
        menuItems={globalMenuOptions}
        accountInfo={userAccountInfo}
        activeLink="lista"
        onNavigate={handleNavigation}
        isMenuOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* 2. Conteúdo Principal */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        
        {/* Header Mobile */}
        <header className="flex items-center justify-between mb-8 md:hidden">
            <button onClick={() => setIsMenuOpen(true)} className={`p-2 rounded-lg text-2xl ${modoNoturno ? 'bg-gray-700' : 'bg-white shadow'}`}>
                ☰
            </button>
            <h1 className="text-xl font-bold">Lista de Compras 🛒</h1>
            <div className="w-8"></div> {/* Placeholder para alinhar o título centralmente */}
        </header>

        <div className="max-w-3xl mx-auto">
          {/* <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-extrabold hidden md:block text-blue-500">📝 Planejar Compras</h2>
            <button onClick={onGoHome} className={`p-2 rounded-lg  ${modoNoturno ? 'bg-gray-700' : 'bg-white shadow'}`}>← Voltar ao Início</button>
          </div> */}

          {/* Card de Entrada de Dados */}
          <section className={`p-6 rounded-2xl shadow-lg mb-8 ${modoNoturno ? 'bg-gray-800' : 'bg-white'}`}>
            <form onSubmit={addItem} className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                placeholder="Ex: Arroz Integral" 
                className={`flex-grow p-4 rounded-xl border-2 outline-none transition focus:ring-2 focus:ring-blue-500 ${modoNoturno ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  className={`w-24 p-4 rounded-xl border-2 text-center font-bold ${modoNoturno ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}
                  value={qty}
                  min="1"
                  onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                />
                <button type="submit" className="flex-grow sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl font-black shadow-md transition-all active:scale-95 text-xl">
                  +
                </button>
              </div>
            </form>
          </section>

          {/* Listagem de Itens */}
          <section className="space-y-3 mb-24">
            {items.length === 0 ? (
              <div className="text-center py-20 opacity-40">
                <span className="text-6xl block mb-4">🛒</span>
                <p>Sua lista está vazia. Comece a adicionar itens!</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className={`flex justify-between items-center p-4 rounded-xl border-l-4 border-blue-500 shadow-sm transition-all ${modoNoturno ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-md'}`}>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">{item.name}</span>
                    <span className="text-sm opacity-60">{item.quantity} unidades</span>
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)} 
                    className={`p-3 rounded-lg transition-colors ${modoNoturno ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </section>

          {/* Barra de Ações Flutuante (quando há itens) */}
          {items.length > 0 && !showFinalizeOptions && (
            <div className="fixed bottom-8 left-0 right-0 px-4 md:left-64 flex justify-center animate-bounce-in">
              <button 
                onClick={() => setShowFinalizeOptions(true)}
                className="w-full max-w-md py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black shadow-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-3"
              >
                ✓ Finalizar Lista
              </button>
            </div>
          )}

          {/* Modal de Escolha de Destino */}
          {showFinalizeOptions && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${modoNoturno ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-2xl font-black text-center mb-6">Indo ao mercado?</h3>
                <p className="text-center opacity-70 mb-8">Como você deseja registrar os preços agora?</p>
                
                <div className="grid gap-4">
                  <button 
                    onClick={() => onSelectOption('somar', '')}
                    className="p-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                  >
                    Somar Valores (Simples)
                  </button>
                  <button 
                    onClick={() => onSelectOption('estipular', 'subtrair')}
                    className="p-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition"
                  >
                    Definir Orçamento (Subtrair)
                  </button>
                  <button 
                    onClick={() => setShowFinalizeOptions(false)}
                    className="mt-4 text-sm opacity-50 font-bold"
                  >
                    Continuar editando lista
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ListaPlan;