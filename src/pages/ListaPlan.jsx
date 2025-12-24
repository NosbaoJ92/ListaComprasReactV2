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

  const globalMenuOptions = useMemo(() => [
    { id: 'home', icon: '🏠', type: 'link', description: 'Voltar para o Início' },
    { id: 'gestor', icon: '📦', type: 'link', description: 'Gerenciar Produtos' },
    { id: 'themeToggle', icon: modoNoturno ? '☀️' : '🌙', type: 'toggleTheme', description: `Tema: ${modoNoturno ? 'Escuro' : 'Claro'}` },
  ].filter(item => item.id !== 'gestor' || isAdmin), [isAdmin, modoNoturno]);

  // --- LÓGICAS DE MANIPULAÇÃO ---

  const addItem = (e) => {
    e?.preventDefault();
    const trimmedName = newItem.trim();
    if (!trimmedName) return;
    
    // AJUSTADO: Agora os nomes das propriedades batem com SomarValor.jsx
    const item = { 
      id: Date.now(), 
      nome: trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1), 
      quantidade: Number(qty) || 1, 
      valor: 0, // Inicia zerado para ser preenchido no mercado
      total: 0, 
      checked: false 
    };
    
    setItems([item, ...items]);
    setNewItem('');
    setQty(1);
    inputRef.current?.focus();
  };

  const handleEditQty = (id, value) => {
    const newQty = value === '' ? '' : Math.max(1, parseInt(value));
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: newQty } : item
    ));
  };

  const validateBlurQty = (id, currentQty) => {
    if (currentQty === '' || currentQty < 1) {
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, quantity: 1 } : item
      ));
    }
  };

  const finalizarParaCompra = (metodo, subtipo = '') => {
    // Como os items já estão no estado global via setItems, 
    // a onSelectOption só precisa mudar a tela
    onSelectOption(metodo, subtipo);
    setShowFinalizeOptions(false);
  };

  return (
    <div className={`flex min-h-screen w-full transition-colors duration-500 ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}} />

      <SidebarMenu
        menuItems={globalMenuOptions}
        accountInfo={{
          username: usuarioLogado?.name || "Usuário",
          email: usuarioLogado?.email || "",
          onLogout: onLogoutSuccess,
          isAdmin
        }}
        activeLink="lista"
        onNavigate={(id) => id === 'home' ? onGoHome() : onSelectOption(id, '')}
        isMenuOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsMenuOpen(true)} className="p-2 md:hidden hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <span className="text-2xl">☰</span>
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">Lista de Planejamento 🛒</h1>
                <p className="text-xs font-bold opacity-40 uppercase tracking-tighter">Prepare sua ida ao mercado</p>
              </div>
            </div>

            {items.length > 0 && (
              <button 
                onClick={() => setExibirModalConfirmacao(true)}
                className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-full border border-red-200 dark:border-red-900/50 transition-all"
              >
                LIMPAR
              </button>
            )}
          </header>

          {/* Form de Adição */}
          <section className={`p-3 rounded-2xl shadow-xl mb-10 border transition-all ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <form onSubmit={addItem} className="flex flex-col sm:flex-row gap-3">
              <input 
                ref={inputRef}
                type="text" 
                placeholder="O que você precisa comprar?" 
                className={`flex-grow p-5 rounded-xl outline-none font-medium transition ${modoNoturno ? 'bg-gray-900 focus:bg-black text-white' : 'bg-gray-100 focus:bg-gray-200 text-black'}`}
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
              />
              
              <div className="flex gap-2">
                <div className={`flex flex-col justify-center items-center px-6 rounded-xl ${modoNoturno ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <span className="text-[9px] font-black opacity-40 uppercase mb-[-4px]">Qtd</span>
                  <input 
                    type="number"
                    min="1"
                    className="bg-transparent border-none font-black w-10 text-center outline-none text-xl"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="flex-grow sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-xl font-black shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </section>

          {/* Listagem */}
          <section className="space-y-4 pb-48">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                <p className="text-2xl font-black ">Sua lista está vazia</p>
                <p className="text-sm">Adicione itens para começar</p>
              </div>
            ) : (
              items.map((item) => (
                <div 
                  key={item.id} 
                  className={`group flex items-center justify-between p-5 rounded-3xl border-l-8 transition-all duration-300 ${
                    modoNoturno 
                    ? 'bg-gray-800/60 border-blue-500 hover:bg-gray-800 shadow-lg' 
                    : 'bg-white border-blue-600 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`relative flex items-center justify-center h-14 w-14 rounded-2xl ${modoNoturno ? 'bg-gray-900' : 'bg-gray-50'}`}>
                      <input 
                        type="number"
                        min="1"
                        value={item.quantity} // Mantido como quantity para exibição, mas o addItem gera objeto padronizado
                        onChange={(e) => handleEditQty(item.id, e.target.value)}
                        onBlur={() => validateBlurQty(item.id, item.quantity)}
                        className="bg-transparent font-black text-xl w-full text-center border-none outline-none text-blue-500"
                      />
                      <span className="absolute -top-2 -right-1 text-[8px] font-black bg-blue-600 text-white px-1 rounded">QTD</span>
                    </div>
                    <div>
                      <h3 className="font-black text-lg tracking-tight">{item.nome}</h3>
                      <p className="text-[10px] opacity-40 font-bold uppercase">Item Planejado</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setItems(items.filter(i => i.id !== item.id))}
                    className={`h-12 w-12 flex items-center justify-center rounded-2xl transition-all ${
                        modoNoturno ? 'hover:bg-red-900/30 text-gray-500' : 'hover:bg-red-50 text-gray-400'
                    } hover:text-red-500`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </section>

          {/* Modal de Finalização */}
          {showFinalizeOptions && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className={`w-full max-w-lg p-8 rounded-[3rem] shadow-2xl ${modoNoturno ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
                <div className="text-center mb-8">
                  <span className="text-5xl">🎯</span>
                  <h3 className="text-3xl font-black mt-4">Qual a meta hoje?</h3>
                  <p className="opacity-60 font-medium">Sua lista será carregada no modo escolhido</p>
                </div>

                <div className="grid gap-4">
                  <button 
                    onClick={() => finalizarParaCompra('somar')}
                    className="flex items-center gap-6 p-6 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white text-left transition-all active:scale-95"
                  >
                    <div className="text-4xl">🛒</div>
                    <div>
                      <h4 className="font-black text-xl">Somar Carrinho</h4>
                      <p className="text-sm opacity-80">Inserir preços e ver o total acumulado.</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => finalizarParaCompra('estipular', 'subtrair')}
                    className="flex items-center gap-6 p-6 rounded-3xl bg-purple-600 hover:bg-purple-700 text-white text-left transition-all active:scale-95"
                  >
                    <div className="text-4xl">💰</div>
                    <div>
                      <h4 className="font-black text-xl">Respeitar Orçamento</h4>
                      <p className="text-sm opacity-80">Ver quanto dinheiro ainda resta do seu limite.</p>
                    </div>
                  </button>
                  
                  <button onClick={() => setShowFinalizeOptions(false)} className="mt-4 py-2 font-bold opacity-50 hover:opacity-100">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Botão Flutuante de Ação */}
          {items.length > 0 && !showFinalizeOptions && (
            <div className="fixed bottom-8 left-0 right-0 px-6 md:ml-64 flex justify-center z-40">
              <button 
                onClick={() => setShowFinalizeOptions(true)}
                className="w-full max-w-lg bg-blue-600 text-white py-6 rounded-full font-black shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                IR PARA O MERCADO ({items.length})
                <span className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center">→</span>
              </button>
            </div>
          )}

          {/* Modal de Confirmação de Limpeza */}
          {exibirModalConfirmacao && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className={`w-full max-w-xs p-8 rounded-[2.5rem] text-center ${modoNoturno ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
                <h3 className="text-2xl font-black mb-4">Limpar tudo?</h3>
                <div className="flex flex-col gap-2">
                  <button onClick={() => { setItems([]); setExibirModalConfirmacao(false); }} className="p-4 bg-red-500 text-white rounded-2xl font-bold active:scale-95">Zerar Lista</button>
                  <button onClick={() => setExibirModalConfirmacao(false)} className="p-4 font-bold opacity-50">Voltar</button>
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