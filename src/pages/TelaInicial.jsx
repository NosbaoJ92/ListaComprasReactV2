import React, { useState } from 'react';
import { useTheme } from '../components/ThemeContext';
import SidebarMenu from '../components/SidebarMenu';

const TelaInicial = ({ onSelectOption, onLogoutSuccess, usuarioLogado }) => {
  const isAdmin = usuarioLogado?.role === 'admin';
  const userEmail = usuarioLogado?.email || 'usuario@app.com';
  const userName =
    usuarioLogado?.name || (isAdmin ? 'Admin Mestre' : 'Usuário Comum');

  const [option, setOption] = useState('');
  const [subOption, setSubOption] = useState('');
  const [currentPage, setCurrentPage] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { modoNoturno } = useTheme();

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    if (onLogoutSuccess) {
      onLogoutSuccess();
    } else {
      alert('Sessão encerrada.');
    }
  };

  const baseMenuOptions = [
    {
      id: 'home',
      icon: '🏠',
      type: 'link',
      description: 'Voltar para a seleção de modo',
    },
    {
      id: 'gestor',
      icon: '📦',
      type: 'link',
      description: 'Gerenciar códigos de barras',
    },
    {
      id: 'themeToggle',
      icon: '🌙',
      type: 'toggleTheme',
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
    onLogout: handleLogout,
    isAdmin,
  };

  const handleMainOptionChange = (value) => {
    setOption(value);
    setSubOption('');
  };

  const handleSubOptionChange = (value) => {
    setSubOption(value);
  };

  const handleConfirm = () => {
    if (!option) {
      alert('Por favor, selecione uma opção.');
      return;
    }

    if (option === 'estipular' && !subOption) {
      alert('Por favor, selecione uma subopção para "Estipular valor".');
      return;
    }

    onSelectOption(option, subOption);
  };

  const handleNavigation = (pageId) => {
    if (pageId === 'gestor' && !isAdmin) {
      alert('Acesso negado.');
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

  const opcoesPrincipais = [
    {
      id: 'lista',
      titulo: 'Criar Lista',
      descricao: 'Monte sua lista antes de ir ao mercado.',
      icone: '📝',
      cor: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'somar',
      titulo: 'Somar Valores',
      descricao: 'Acompanhe o total gasto em tempo real.',
      icone: '🧮',
      cor: 'from-purple-500 to-indigo-500',
    },
    {
      id: 'estipular',
      titulo: 'Estipular Valor',
      descricao: 'Defina um limite ou orçamento para suas compras.',
      icone: '💰',
      cor: 'from-emerald-500 to-green-500',
    },
  ];

  const subOpcoes = [
    {
      id: 'subtrair',
      titulo: 'Subtrair de um valor',
      descricao: 'Informe um valor inicial e acompanhe quanto ainda resta.',
      icone: '➖',
    },
    {
      id: 'maximo',
      titulo: 'Valor máximo de gasto',
      descricao: 'Defina um teto e controle para não ultrapassar.',
      icone: '🎯',
    },
  ];

  const getOptionLabel = () => {
    if (option === 'lista') return 'Criar Lista';
    if (option === 'somar') return 'Somar Valores';
    if (option === 'estipular' && subOption === 'subtrair') {
      return 'Estipular valor para subtrair';
    }
    if (option === 'estipular' && subOption === 'maximo') {
      return 'Estipular valor máximo';
    }
    if (option === 'estipular') return 'Estipular Valor';
    return 'Nenhuma opção selecionada';
  };

  const renderHomeContent = () => (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="w-full max-w-6xl mx-auto flex flex-col h-full">
        <div className="flex-shrink-0 mb-5">
          <div
            className={`
              rounded-3xl p-5 sm:p-7 border shadow-sm
              ${
                modoNoturno
                  ? 'bg-gray-800/80 border-gray-700'
                  : 'bg-white border-gray-200'
              }
            `}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <span
                  className={`
                    inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3
                    ${
                      modoNoturno
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-blue-50 text-blue-700'
                    }
                  `}
                >
                  🛒 Lista de Compras Online
                </span>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
                  Olá, {userName.split(' ')[0]}!
                </h1>

                <p
                  className={`
                    mt-2 text-sm sm:text-base max-w-2xl
                    ${modoNoturno ? 'text-gray-300' : 'text-gray-600'}
                  `}
                >
                  Escolha como deseja controlar suas compras hoje. Você pode
                  criar uma lista, somar valores ou definir um orçamento máximo.
                </p>
              </div>

              {/* <div
                className={`
                  rounded-2xl px-4 py-3 border min-w-[180px]
                  ${
                    modoNoturno
                      ? 'bg-gray-900 border-gray-700'
                      : 'bg-gray-50 border-gray-200'
                  }
                `}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    modoNoturno ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  Modo atual
                </p>
                <p className="text-lg font-black mt-1">
                  {option ? getOptionLabel() : 'Aguardando escolha'}
                </p>
              </div> */}
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {opcoesPrincipais.map((item) => {
              const selected = option === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMainOptionChange(item.id)}
                  className={`
                    group relative overflow-hidden text-left rounded-3xl border-2 p-5 sm:p-6 transition-all duration-300
                    ${
                      selected
                        ? modoNoturno
                          ? 'border-blue-400 bg-gray-800 shadow-2xl shadow-blue-900/30 scale-[1.02]'
                          : 'border-blue-500 bg-white shadow-2xl shadow-blue-200/70 scale-[1.02]'
                        : modoNoturno
                          ? 'border-gray-700 bg-gray-800/80 hover:bg-gray-800 hover:border-gray-500'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xl'
                    }
                  `}
                >
                  {selected && (
                    <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-black">
                      ✓
                    </div>
                  )}

                  <div
                    className={`
                      w-16 h-16 rounded-2xl bg-gradient-to-br ${item.cor}
                      flex items-center justify-center text-3xl shadow-lg mb-5
                      group-hover:scale-110 transition-transform duration-300
                    `}
                  >
                    {item.icone}
                  </div>

                  <h2 className="text-xl font-black mb-2">{item.titulo}</h2>

                  <p
                    className={`text-sm leading-relaxed ${
                      modoNoturno ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {item.descricao}
                  </p>

                  <div
                    className={`
                      mt-5 h-1.5 rounded-full overflow-hidden
                      ${modoNoturno ? 'bg-gray-700' : 'bg-gray-100'}
                    `}
                  >
                    <div
                      className={`
                        h-full rounded-full bg-gradient-to-r ${item.cor}
                        transition-all duration-300
                        ${selected ? 'w-full' : 'w-0 group-hover:w-2/3'}
                      `}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {option === 'estipular' && (
            <div
              className={`
                mt-6 rounded-3xl border p-5 sm:p-6 shadow-sm
                ${
                  modoNoturno
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }
              `}
            >
              <div className="mb-5">
                <h3 className="text-xl sm:text-2xl font-black">
                  Como deseja controlar o valor?
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    modoNoturno ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  Escolha uma das opções abaixo para continuar.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subOpcoes.map((item) => {
                  const selected = subOption === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSubOptionChange(item.id)}
                      className={`
                        flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-300
                        ${
                          selected
                            ? modoNoturno
                              ? 'border-green-400 bg-green-500/10'
                              : 'border-green-500 bg-green-50'
                            : modoNoturno
                              ? 'border-gray-700 bg-gray-900 hover:border-gray-500'
                              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }
                      `}
                    >
                      <div
                        className={`
                          w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0
                          ${
                            selected
                              ? 'bg-green-600 text-white'
                              : modoNoturno
                                ? 'bg-gray-700'
                                : 'bg-white'
                          }
                        `}
                      >
                        {item.icone}
                      </div>

                      <div className="flex-grow">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="font-black">{item.titulo}</h4>

                          <span
                            className={`
                              w-5 h-5 rounded-full border flex items-center justify-center text-xs
                              ${
                                selected
                                  ? 'bg-green-600 border-green-600 text-white'
                                  : modoNoturno
                                    ? 'border-gray-500'
                                    : 'border-gray-300'
                              }
                            `}
                          >
                            {selected ? '✓' : ''}
                          </span>
                        </div>

                        <p
                          className={`text-sm mt-1 ${
                            modoNoturno ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          {item.descricao}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div
            className={`
              mt-6 rounded-3xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4
              ${
                modoNoturno
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }
            `}
          >
            <div>
              <p
                className={`text-xs uppercase tracking-wide font-bold ${
                  modoNoturno ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Resumo da escolha
              </p>

              <p className="text-lg font-black mt-1">{getOptionLabel()}</p>

              {option === 'estipular' && !subOption && (
                <p className="text-sm text-red-500 font-semibold mt-1">
                  Selecione uma subopção para continuar.
                </p>
              )}
            </div>

            <button
              onClick={handleConfirm}
              disabled={!option || (option === 'estipular' && !subOption)}
              className={`
                w-full sm:w-auto min-w-[220px] px-8 py-4 rounded-2xl text-base sm:text-lg font-black transition-all duration-300
                ${
                  (option && option !== 'estipular') ||
                  (option === 'estipular' && subOption)
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl active:scale-95'
                    : modoNoturno
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Confirmar escolha
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`
        h-screen w-full flex overflow-hidden
        ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}
      `}
    >
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={closeMenu}
        />
      )}

      <SidebarMenu
        menuItems={globalMenuOptions}
        accountInfo={userAccountInfo}
        activeLink={currentPage}
        onNavigate={handleNavigation}
        isMenuOpen={isMenuOpen}
        onClose={closeMenu}
      />

      <main className="flex-grow flex flex-col h-full p-4 sm:p-6 lg:p-8 overflow-hidden">
        <header className="md:hidden flex-shrink-0 flex items-center justify-between mb-4">
          <button
            onClick={toggleMenu}
            className={`
              w-11 h-11 rounded-2xl text-2xl flex items-center justify-center shadow-sm
              ${modoNoturno ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
            `}
          >
            ☰
          </button>

          <div className="w-11" />
        </header>

        <div className="flex-grow overflow-hidden">
          {currentPage === 'home' && renderHomeContent()}

          {currentPage === 'gestor' && (
            <div className="h-full overflow-y-auto">
              {isAdmin ? (
                <div
                  className={`
                    max-w-3xl mx-auto mt-10 rounded-3xl border p-8 text-center shadow-sm
                    ${
                      modoNoturno
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                    }
                  `}
                >
                  <div className="text-5xl mb-4">📦</div>
                  <h1 className="text-2xl font-black">
                    Gestor EAN - Admin aprovado
                  </h1>
                  <p
                    className={`mt-2 ${
                      modoNoturno ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    Acesso total para gerenciar códigos de barras.
                  </p>
                </div>
              ) : (
                <div className="text-center mt-16 text-red-600 font-bold">
                  <h1>Acesso Negado 🛑</h1>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TelaInicial;