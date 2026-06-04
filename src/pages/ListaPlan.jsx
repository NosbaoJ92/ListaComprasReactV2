import React, { useState, useRef } from 'react';
import SidebarMenu from '../components/SidebarMenu';

const ListaPlan = ({
  items = [],
  setItems,
  onGoHome,
  modoNoturno,
  usuarioLogado,
  onLogoutSuccess,
  onSelectOption,
}) => {
  const [newItem, setNewItem] = useState('');
  const [qty, setQty] = useState(1);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFinalizeOptions, setShowFinalizeOptions] = useState(false);
  const [exibirModalConfirmacao, setExibirModalConfirmacao] = useState(false);
  const [exibirModalAdicionar, setExibirModalAdicionar] = useState(false);

  const inputRef = useRef(null);

  const isAdmin = usuarioLogado?.role === 'admin';

  const userName = usuarioLogado?.name || 'Usuário';
  const userEmail = usuarioLogado?.email || 'usuario@app.com';

  const baseMenuOptions = [
    {
      id: 'home',
      icon: '🏠',
      type: 'link',
      label: 'Início',
      description: 'Voltar para o Início',
    },
    {
      id: 'gestor',
      icon: '📦',
      type: 'link',
      label: 'Gestor',
      description: 'Gerenciar Produtos',
    },
    {
      id: 'themeToggle',
      icon: modoNoturno ? '☀️' : '🌙',
      type: 'toggleTheme',
      label: 'Tema',
      description: `Tema: ${modoNoturno ? 'Escuro' : 'Claro'}`,
    },
  ];

  const globalMenuOptions = baseMenuOptions.filter((item) => {
    if (item.id === 'gestor' && !isAdmin) return false;
    return true;
  });

  const userAccountInfo = {
    username: userName,
    email: userEmail,
    onLogout: onLogoutSuccess,
    isAdmin,
  };

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  const abrirModalAdicionar = () => {
    setExibirModalAdicionar(true);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  const fecharModalAdicionar = () => {
    setExibirModalAdicionar(false);
    setNewItem('');
    setQty(1);
  };

  const handleNavigation = (pageId) => {
    if (pageId === 'home') {
      onGoHome?.();
    } else if (pageId === 'gestor' && !isAdmin) {
      alert('Acesso negado.');
    } else if (pageId === 'gestor') {
      onSelectOption?.('gestor', '');
    }

    closeMenu();
  };

  const normalizarNome = (nome) => {
    const texto = nome.trim();

    if (!texto) return '';

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  };

  const addItem = (e) => {
    e?.preventDefault();

    const trimmedName = newItem.trim();

    if (!trimmedName) {
      inputRef.current?.focus();
      return;
    }

    const quantidadeFinal = Math.max(1, Number(qty) || 1);

    const item = {
      id: Date.now(),
      nome: normalizarNome(trimmedName),
      quantidade: quantidadeFinal,
      valor: 0,
      total: 0,
      checked: false,
    };

    setItems([item, ...items]);
    setNewItem('');
    setQty(1);
    setExibirModalAdicionar(false);
  };

  const removerItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const alterarQuantidade = (id, novaQuantidade) => {
    const quantidadeFinal = Math.max(1, Number(novaQuantidade) || 1);

    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              quantidade: quantidadeFinal,
            }
          : item
      )
    );
  };

  const alterarQuantidadeFormulario = (novaQuantidade) => {
    setQty(Math.max(1, Number(novaQuantidade) || 1));
  };

  const finalizarParaCompra = (metodo, subtipo = '') => {
    onSelectOption?.(metodo, subtipo, items);
    setShowFinalizeOptions(false);
  };

  const limparTudo = () => {
    setItems([]);
    setExibirModalConfirmacao(false);
  };

  const containerBase = modoNoturno
    ? 'bg-gray-900 text-gray-100'
    : 'bg-gray-100 text-gray-900';

  const cardBase = modoNoturno
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200';

  const inputBase = modoNoturno
    ? 'bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20';

  return (
    <div className={`h-screen w-full flex overflow-hidden ${containerBase}`}>
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={closeMenu}
        />
      )}

      <SidebarMenu
        menuItems={globalMenuOptions}
        accountInfo={userAccountInfo}
        activeLink="lista"
        onNavigate={handleNavigation}
        isMenuOpen={isMenuOpen}
        onClose={closeMenu}
      />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <header
          className={`
            md:hidden flex-shrink-0 flex items-center justify-between px-3 py-2.5 z-20 shadow-sm border-b
            ${
              modoNoturno
                ? 'bg-gray-900 border-gray-800'
                : 'bg-gray-100 border-gray-200'
            }
          `}
        >
          <button
            onClick={toggleMenu}
            className={`
              w-10 h-10 rounded-2xl text-2xl flex items-center justify-center shadow-sm
              ${modoNoturno ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
            `}
          >
            ☰
          </button>

          <div className="text-center">
            <h1 className="text-base font-black leading-tight">Planejamento</h1>
            <p
              className={`text-[9px] font-bold uppercase tracking-[0.18em] ${
                modoNoturno ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Lista de compras
            </p>
          </div>

          <div className="w-10" />
        </header>

        <div className="flex-1 min-h-0 overflow-hidden p-2 sm:p-5 lg:p-6">
          <div className="max-w-5xl mx-auto h-full flex flex-col min-h-0 overflow-hidden">
            <div
              className={`
                hidden md:flex flex-shrink-0 rounded-2xl border shadow-sm px-5 py-4 mb-4 items-center justify-between gap-6
                ${cardBase}
              `}
            >
              <div>
                <span
                  className={`
                    inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black mb-2
                    ${
                      modoNoturno
                        ? 'bg-green-500/15 text-green-300'
                        : 'bg-green-50 text-green-700'
                    }
                  `}
                >
                  🛒 Modo planejamento
                </span>

                <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                  Sua lista de compras
                </h1>

                <p
                  className={`mt-1 max-w-2xl text-sm ${
                    modoNoturno ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  Adicione os produtos que pretende comprar e depois siga para o mercado.
                </p>
              </div>

              <button
                onClick={abrirModalAdicionar}
                className="
                  px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white
                  text-base font-black shadow-lg shadow-blue-600/20 transition-all active:scale-95
                  flex items-center justify-center gap-2 whitespace-nowrap
                "
              >
                <span className="text-xl">+</span>
                <span>Adicionar item</span>
              </button>
            </div>

            <div
              className={`
                flex-1 min-h-0 overflow-hidden rounded-2xl border shadow-sm flex flex-col
                ${cardBase}
              `}
            >
              <div
                className={`
                  flex-shrink-0 border-b px-3 sm:px-5 py-3 sm:py-4
                  ${modoNoturno ? 'border-gray-700' : 'border-gray-200'}
                `}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-black text-lg sm:text-xl">
                      Itens planejados
                    </h2>

                    <p
                      className={`text-xs sm:text-sm ${
                        modoNoturno ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {items.length === 0
                        ? 'Nenhum produto na lista'
                        : `${items.length} item(ns) adicionados`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {items.length > 0 && (
                      <button
                        onClick={() => setExibirModalConfirmacao(true)}
                        className="
                          hidden sm:inline-flex px-3 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white
                          text-xs font-black transition-all
                        "
                      >
                        Limpar
                      </button>
                    )}

                    <button
                      onClick={abrirModalAdicionar}
                      className="
                        px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white
                        text-xs sm:text-sm font-black transition-all active:scale-95 shadow-md shadow-blue-600/20
                        flex items-center justify-center gap-1.5
                      "
                    >
                      <span className="text-base leading-none">+</span>
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 sm:p-5 space-y-2 sm:space-y-3 custom-scrollbar">
                {items.length === 0 ? (
                  <div className="h-full min-h-[230px] flex flex-col items-center justify-center text-center px-4">
                    <div
                      className={`
                        w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl mb-4
                        ${modoNoturno ? 'bg-gray-900' : 'bg-gray-100'}
                      `}
                    >
                      🛒
                    </div>

                    <h3 className="text-lg sm:text-xl font-black">
                      Sua lista está vazia
                    </h3>

                    <p
                      className={`mt-2 max-w-sm text-xs sm:text-sm ${
                        modoNoturno ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Toque em <strong>Adicionar</strong> para incluir o primeiro produto.
                    </p>

                    <button
                      onClick={abrirModalAdicionar}
                      className="
                        mt-5 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white
                        font-black transition-all active:scale-95 shadow-lg shadow-blue-600/20
                      "
                    >
                      + Adicionar primeiro item
                    </button>
                  </div>
                ) : (
                  items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`
                        group rounded-2xl border p-3 sm:p-4 transition-all
                        ${
                          modoNoturno
                            ? 'bg-gray-900 border-gray-700 hover:border-blue-500'
                            : 'bg-gray-50 border-gray-200 hover:border-blue-400 hover:bg-white'
                        }
                      `}
                    >
                      <div className="flex justify-between items-center gap-3">
                        <div
                          className="
                            w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center
                            font-black shadow-md flex-shrink-0
                          "
                        >
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex relative items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-black text-base sm:text-lg truncate">
                                {item.nome}
                              </p>

                              <p
                                className={`text-xs mt-0.5 ${
                                  modoNoturno ? 'text-gray-400' : 'text-gray-500'
                                }`}
                              >
                                {item.quantidade} unidade(s)
                              </p>
                            </div>

                            <div
                              className={`
                                h-10 rounded-xl border grid grid-cols-[40px_52px_40px] overflow-hidden flex-shrink-0
                                ${
                                  modoNoturno
                                    ? 'bg-gray-800 border-gray-700'
                                    : 'bg-white border-gray-200'
                                }
                              `}
                            >
                              <button
                                onClick={() =>
                                  alterarQuantidade(
                                    item.id,
                                    Number(item.quantidade || 1) - 1
                                  )
                                }
                                className={`
                                  h-full font-black transition flex items-center justify-center
                                  ${
                                    modoNoturno
                                      ? 'hover:bg-gray-700'
                                      : 'hover:bg-gray-100'
                                  }
                                `}
                              >
                                −
                              </button>

                              <input
                                type="number"
                                min="1"
                                value={item.quantidade}
                                onChange={(e) =>
                                  alterarQuantidade(item.id, e.target.value)
                                }
                                className={`
                                  h-full w-full text-center font-black border-x outline-none min-w-0
                                  ${
                                    modoNoturno
                                      ? 'bg-gray-800 border-gray-700'
                                      : 'bg-white border-gray-200'
                                  }
                                `}
                              />

                              <button
                                onClick={() =>
                                  alterarQuantidade(
                                    item.id,
                                    Number(item.quantidade || 1) + 1
                                  )
                                }
                                className={`
                                  h-full font-black transition flex items-center justify-center
                                  ${
                                    modoNoturno
                                      ? 'hover:bg-gray-700'
                                      : 'hover:bg-gray-100'
                                  }
                                `}
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => removerItem(item.id)}
                              className="
                                hidden sm:flex items-center justify-center
                                w-9 h-9 rounded-xl text-red-500 hover:bg-red-500 hover:text-white
                                transition-all font-black flex-shrink-0
                              "
                              title="Remover item"
                            >
                              ✕
                            </button>
                          </div>

                          <button
                            onClick={() => removerItem(item.id)}
                            className="
                              sm:hidden mt-3 w-full h-9 rounded-xl bg-red-500/10 text-red-500
                              hover:bg-red-500 hover:text-white transition-all font-black text-xs
                            "
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {items.length > 0 && <div className="h-1" />}
              </div>
            </div>

            {items.length > 0 && (
              <div
                className={`
                  flex-shrink-0 mt-3 rounded-2xl border shadow-xl p-3
                  ${cardBase}
                `}
              >
                <button
                  onClick={() => setShowFinalizeOptions(true)}
                  className="
                    w-full px-6 py-3.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white
                    text-base sm:text-lg font-black shadow-lg shadow-green-600/20 transition-all active:scale-95
                    flex items-center justify-center gap-3
                  "
                >
                  Ir para o mercado
                  <span className="text-xl">➜</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {exibirModalAdicionar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
          <div
            className={`
              w-full max-w-md rounded-[2rem] border shadow-2xl overflow-hidden
              ${
                modoNoturno
                  ? 'bg-gray-800 border-gray-700 text-gray-100'
                  : 'bg-white border-gray-200 text-gray-900'
              }
            `}
          >
            <form onSubmit={addItem}>
              <div
                className={`
                  px-5 sm:px-6 py-5 border-b
                  ${modoNoturno ? 'border-gray-700' : 'border-gray-200'}
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black">
                      Adicionar item
                    </h3>

                    <p
                      className={`mt-1 text-sm ${
                        modoNoturno ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Informe o produto e a quantidade desejada.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fecharModalAdicionar}
                    className={`
                      w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black transition flex-shrink-0
                      ${
                        modoNoturno
                          ? 'bg-gray-900 hover:bg-gray-700 text-gray-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }
                    `}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="px-5 sm:px-6 py-5 space-y-4">
                <div>
                  <label
                    className={`block text-xs font-black uppercase tracking-wide mb-2 ${
                      modoNoturno ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Produto
                  </label>

                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ex: Arroz, feijão, leite..."
                    className={`
                      w-full h-12 px-4 rounded-2xl border outline-none font-semibold transition-all focus:ring-4
                      ${inputBase}
                    `}
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    className={`block text-xs font-black uppercase tracking-wide mb-2 ${
                      modoNoturno ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Quantidade
                  </label>

                  <div
                    className={`
                      h-12 rounded-2xl border grid grid-cols-[52px_minmax(0,1fr)_52px] overflow-hidden w-full
                      ${
                        modoNoturno
                          ? 'bg-gray-900 border-gray-700'
                          : 'bg-gray-50 border-gray-200'
                      }
                    `}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        alterarQuantidadeFormulario(Number(qty || 1) - 1)
                      }
                      className={`
                        h-full w-full font-black text-xl transition flex items-center justify-center
                        ${
                          modoNoturno
                            ? 'hover:bg-gray-800 text-gray-200'
                            : 'hover:bg-gray-200 text-gray-800'
                        }
                      `}
                    >
                      −
                    </button>

                    <input
                      type="number"
                      min="1"
                      className={`
                        h-full w-full min-w-0 text-center font-black outline-none border-x
                        ${
                          modoNoturno
                            ? 'bg-gray-900 border-gray-700 text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                        }
                      `}
                      value={qty}
                      onChange={(e) => alterarQuantidadeFormulario(e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        alterarQuantidadeFormulario(Number(qty || 1) + 1)
                      }
                      className={`
                        h-full w-full font-black text-xl transition flex items-center justify-center
                        ${
                          modoNoturno
                            ? 'hover:bg-gray-800 text-gray-200'
                            : 'hover:bg-gray-200 text-gray-800'
                        }
                      `}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div
                className={`
                  px-5 sm:px-6 py-5 border-t grid grid-cols-1 sm:grid-cols-2 gap-3
                  ${modoNoturno ? 'border-gray-700' : 'border-gray-200'}
                `}
              >
                <button
                  type="button"
                  onClick={fecharModalAdicionar}
                  className={`
                    h-12 rounded-2xl font-black transition-all active:scale-95
                    ${
                      modoNoturno
                        ? 'bg-gray-900 hover:bg-gray-700 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }
                  `}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="
                    h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white
                    font-black transition-all active:scale-95 shadow-lg shadow-blue-600/20
                  "
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFinalizeOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className={`
              w-full max-w-md rounded-[2rem] border shadow-2xl overflow-hidden
              ${
                modoNoturno
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }
            `}
          >
            <div className="p-6 sm:p-8 text-center">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-green-600 text-white flex items-center justify-center text-4xl mb-5 shadow-lg">
                🛒
              </div>

              <h3 className="text-2xl font-black">Como deseja comprar?</h3>

              <p
                className={`mt-2 text-sm ${
                  modoNoturno ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Escolha o modo para acompanhar os valores durante a compra.
              </p>

              <div className="grid gap-3 mt-7">
                <button
                  onClick={() => finalizarParaCompra('somar')}
                  className="p-5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all active:scale-95 text-left"
                >
                  <span className="block text-lg">🧮 Somar carrinho</span>
                  <span className="block text-sm opacity-80 font-semibold mt-1">
                    Some os produtos conforme for comprando.
                  </span>
                </button>

                <button
                  onClick={() => finalizarParaCompra('estipular', 'subtrair')}
                  className="p-5 bg-purple-600 text-white rounded-2xl font-black hover:bg-purple-700 transition-all active:scale-95 text-left"
                >
                  <span className="block text-lg">💰 Respeitar orçamento</span>
                  <span className="block text-sm opacity-80 font-semibold mt-1">
                    Informe um valor e acompanhe quanto ainda resta.
                  </span>
                </button>

                <button
                  onClick={() => setShowFinalizeOptions(false)}
                  className={`
                    mt-2 p-4 rounded-2xl font-black transition-all
                    ${
                      modoNoturno
                        ? 'bg-gray-900 hover:bg-gray-700 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }
                  `}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {exibirModalConfirmacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className={`
              w-full max-w-sm rounded-[2rem] border shadow-2xl p-7 text-center
              ${
                modoNoturno
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }
            `}
          >
            <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500 text-white flex items-center justify-center text-4xl mb-5 shadow-lg">
              ⚠️
            </div>

            <h3 className="text-2xl font-black">Limpar toda a lista?</h3>

            <p
              className={`mt-2 text-sm ${
                modoNoturno ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Essa ação removerá todos os itens adicionados ao planejamento.
            </p>

            <div className="grid gap-3 mt-7">
              <button
                onClick={limparTudo}
                className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black transition-all active:scale-95"
              >
                Sim, limpar tudo
              </button>

              <button
                onClick={() => setExibirModalConfirmacao(false)}
                className={`
                  p-4 rounded-2xl font-black transition-all
                  ${
                    modoNoturno
                      ? 'bg-gray-900 hover:bg-gray-700 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }
                `}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaPlan;