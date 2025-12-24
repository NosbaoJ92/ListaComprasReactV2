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
    const inputRef = useRef(null);

    const isAdmin = usuarioLogado?.role === 'admin';

    const globalMenuOptions = useMemo(() => [
        { id: 'home', icon: '🏠', type: 'link', description: 'Voltar para o Início' },
        { id: 'gestor', icon: '📦', type: 'link', description: 'Gerenciar Produtos' },
        { id: 'themeToggle', icon: modoNoturno ? '☀️' : '🌙', type: 'toggleTheme', description: `Tema: ${modoNoturno ? 'Escuro' : 'Claro'}` },
    ].filter(item => item.id !== 'gestor' || isAdmin), [isAdmin, modoNoturno]);

    const addItem = (e) => {
        e?.preventDefault();
        const trimmedName = newItem.trim();
        if (!trimmedName) return;
        
        const item = { 
        id: Date.now(), 
        name: trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1), 
        quantity: qty, 
        price: 0, 
        checked: false 
        };
        
        setItems([item, ...items]);
        setNewItem('');
        setQty(1);
        inputRef.current?.focus(); // Mantém o foco para adicionar o próximo
    };

    const clearAll = () => {
        if (window.confirm("Deseja apagar todos os itens da lista?")) {
        setItems([]);
        }
    };

    const updateQty = (id, delta) => {
        setItems(prev => prev.map(item => 
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        ));
    };

    return (
        <div className={`flex min-h-screen w-full transition-colors duration-500 ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        
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
            
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                <button onClick={() => setIsMenuOpen(true)} className="p-2 md:hidden hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                    <span className="text-2xl">☰</span>
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight">Minha Lista 🛒</h1>
                    <p className="text-xs md:text-sm opacity-50 font-medium uppercase tracking-wider">Planejamento</p>
                </div>
                </div>

                {items.length > 0 && (
                <button 
                    onClick={clearAll}
                    className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors"
                >
                    LIMPAR TUDO
                </button>
                )}
            </header>

            {/* Form de Adição */}
            <section className={`p-2 rounded-[2rem] shadow-2xl mb-8 border transition-all ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <form onSubmit={addItem} className="flex flex-col sm:flex-row gap-2">
                <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="Ex: Leite desnatado..." 
                    className={`flex-grow p-4 rounded-3xl outline-none transition ${modoNoturno ? 'bg-gray-700 focus:bg-gray-600' : 'bg-gray-50 focus:bg-white'}`}
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                />
                
                <div className="flex gap-2 p-1">
                    <div className={`flex items-center gap-3 px-4 rounded-3xl ${modoNoturno ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="text-xl font-bold p-1 hover:text-blue-500">-</button>
                    <span className="font-black min-w-[20px] text-center">{qty}</span>
                    <button type="button" onClick={() => setQty(qty + 1)} className="text-xl font-bold p-1 hover:text-blue-500">+</button>
                    </div>
                    
                    <button 
                    type="submit" 
                    className="flex-grow sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-3xl font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-95"
                    >
                    Adicionar
                    </button>
                </div>
                </form>
            </section>

            {/* Listagem com Scroll Suave */}
            <section className="space-y-3 pb-40">
                {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                    <div className="text-7xl mb-4">🗒️</div>
                    <p className="text-xl font-medium">Nada por aqui ainda...</p>
                    <p className="text-sm">Sua lista de mercado aparece aqui.</p>
                </div>
                ) : (
                items.map((item) => (
                    <div 
                    key={item.id} 
                    className={`group flex items-center justify-between p-4 rounded-2xl border-b-2 transition-all ${
                        modoNoturno 
                        ? 'bg-gray-800/40 border-gray-700 hover:bg-gray-800' 
                        : 'bg-white border-gray-100 hover:shadow-md'
                    }`}
                    >
                    <div className="flex items-center gap-4">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black ${modoNoturno ? 'bg-gray-700 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        {item.quantity}
                        </span>
                        <span className="font-semibold text-lg">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                        onClick={() => updateQty(item.id, 1)}
                        className="hidden group-hover:flex p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                        ➕
                        </button>
                        <button 
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        </button>
                    </div>
                    </div>
                ))
                )}
            </section>

            {/* Botão Flutuante */}
            {items.length > 0 && !showFinalizeOptions && (
                <div className="fixed bottom-8 left-0 right-0 px-6 md:left-64 flex justify-center">
                <button 
                    onClick={() => setShowFinalizeOptions(true)}
                    className="w-full max-w-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white py-5 rounded-[2rem] font-black shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4 group"
                >
                    <span>FINALIZAR E IR COMPRAR</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
                </div>
            )}

            {/* Modal de Finalização Refinado */}
            {showFinalizeOptions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm transition-all">
                <div className={`relative w-full max-w-sm p-8 rounded-[3rem] shadow-2xl border ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <button 
                    onClick={() => setShowFinalizeOptions(false)}
                    className="absolute top-6 right-6 text-2xl opacity-30 hover:opacity-100"
                    >✕</button>
                    
                    <div className="text-center mb-8">
                    <h3 className="text-2xl font-black mb-2">Pronto para as compras?</h3>
                    <p className="opacity-60 text-sm">Como deseja controlar seus gastos?</p>
                    </div>

                    <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => onSelectOption('somar', '')}
                        className="w-full p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                        Somar tudo no carrinho
                    </button>
                    <button 
                        onClick={() => onSelectOption('estipular', 'subtrair')}
                        className="w-full p-5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg shadow-purple-500/20"
                    >
                        Respeitar um orçamento
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