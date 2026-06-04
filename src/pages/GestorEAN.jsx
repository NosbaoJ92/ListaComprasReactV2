import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { useTheme } from '../components/ThemeContext';
import SidebarMenu from '../components/SidebarMenu';

const GestorEAN = ({ onGoHome, usuarioLogado, onSelectOption, onLogoutSuccess }) => {
  const { modoNoturno } = useTheme();

  const [ean, setEan] = useState('');
  const [nomeProduto, setNomeProduto] = useState('');
  const [valorProduto, setValorProduto] = useState('');
  const [leitorAtivo, setLeitorAtivo] = useState(false);
  const [produtosColetados, setProdutosColetados] = useState([]);
  const [erro, setErro] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [produtoEditandoIndex, setProdutoEditandoIndex] = useState(null);
  const [produtoSelecionadoIndex, setProdutoSelecionadoIndex] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const codeReaderRef = useRef(null);
  const videoRef = useRef(null);

  const isAdmin = usuarioLogado?.role === 'admin';
  const userEmail = usuarioLogado?.email || 'usuario@app.com';
  const userName = usuarioLogado?.name || (isAdmin ? 'Admin Mestre' : 'Usuário Comum');

  const containerBase = modoNoturno
    ? 'bg-gray-900 text-gray-100'
    : 'bg-gray-100 text-gray-900';

  const cardBase = modoNoturno
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200';

  const inputBase = modoNoturno
    ? 'bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20';

  const menuItems = [
    {
      id: 'home',
      icon: '🏠',
      type: 'link',
      label: 'Início',
      description: 'Voltar para o início',
    },
    {
      id: 'gestor',
      icon: '📦',
      type: 'link',
      label: 'Gestor',
      description: 'Gerenciar produtos',
    },
    {
      id: 'themeToggle',
      icon: modoNoturno ? '☀️' : '🌙',
      type: 'toggleTheme',
      label: 'Tema',
      description: `Tema: ${modoNoturno ? 'Escuro' : 'Claro'}`,
    },
  ];

  const accountInfo = {
    username: userName,
    email: userEmail,
    isAdmin,
    onLogout: onLogoutSuccess || onGoHome,
  };

  const formatarMoeda = (valor) => {
    return Number(valor || 0).toFixed(2).replace('.', ',');
  };

  const limparCampos = () => {
    setEan('');
    setNomeProduto('');
    setValorProduto('');
    setErro('');
    setProdutoEditandoIndex(null);
    setProdutoSelecionadoIndex(null);
  };

  const pararLeitor = () => {
    try {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }

      const stream = videoRef.current?.srcObject;

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (error) {
      console.error('Erro ao parar câmera:', error);
    }

    setLeitorAtivo(false);
  };

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  const handleNavigation = (pageId) => {
    closeMenu();

    if (pageId === 'home') {
      onGoHome?.();
      return;
    }

    if (pageId === 'gestor') {
      return;
    }

    if (pageId === 'lista') {
      onSelectOption?.('lista', '');
      return;
    }

    if (pageId === 'base') {
      onSelectOption?.('', '');
    }
  };

  useEffect(() => {
    const produtosSalvos = localStorage.getItem('produtosColetados');

    if (produtosSalvos) {
      try {
        setProdutosColetados(JSON.parse(produtosSalvos));
      } catch (error) {
        console.error('Erro ao carregar produtos salvos:', error);
        setProdutosColetados([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('produtosColetados', JSON.stringify(produtosColetados));
  }, [produtosColetados]);

  useEffect(() => {
    if (!leitorAtivo) {
      pararLeitor();
      return;
    }

    const iniciarScanner = async () => {
      setErro('');

      if (!navigator.mediaDevices?.getUserMedia) {
        setErro('Seu navegador não permite acesso à câmera.');
        setLeitorAtivo(false);
        return;
      }

      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        setErro('A câmera no celular precisa de HTTPS para funcionar.');
        setLeitorAtivo(false);
        return;
      }

      try {
        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;

        const tentativasDeCamera = [
          {
            video: {
              facingMode: { exact: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          {
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          {
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          {
            video: true,
          },
        ];

        let iniciou = false;
        let ultimoErro = null;

        for (const constraints of tentativasDeCamera) {
          try {
            await codeReader.decodeFromConstraints(
              constraints,
              'video-gestor-ean',
              (result, err) => {
                if (result) {
                  const codigo = result.getText();

                  setEan(codigo);
                  setErro('');
                  pararLeitor();
                }

                if (err && !(err instanceof NotFoundException)) {
                  console.warn('Erro de leitura:', err);
                }
              }
            );

            iniciou = true;
            break;
          } catch (error) {
            ultimoErro = error;
          }
        }

        if (!iniciou) {
          console.error('Erro ao iniciar câmera:', ultimoErro);
          throw ultimoErro;
        }
      } catch (error) {
        console.error('Erro ao acessar câmera:', error);

        const nomeErro = error?.name;

        if (nomeErro === 'NotAllowedError' || nomeErro === 'PermissionDeniedError') {
          setErro('Permissão da câmera negada. Libere o acesso à câmera no navegador.');
        } else if (nomeErro === 'NotFoundError' || nomeErro === 'DevicesNotFoundError') {
          setErro('Nenhuma câmera foi encontrada neste dispositivo.');
        } else if (nomeErro === 'NotReadableError' || nomeErro === 'TrackStartError') {
          setErro('A câmera já está em uso por outro aplicativo.');
        } else if (nomeErro === 'OverconstrainedError') {
          setErro('Não foi possível usar a câmera traseira. Tente novamente.');
        } else {
          setErro('Erro ao acessar a câmera. Verifique permissões, HTTPS ou tente outro navegador.');
        }

        setLeitorAtivo(false);
      }
    };

    iniciarScanner();

    return () => {
      try {
        if (codeReaderRef.current) {
          codeReaderRef.current.reset();
        }
      } catch (error) {
        console.error('Erro ao limpar scanner:', error);
      }
    };
  }, [leitorAtivo]);

  const handleAddProduto = () => {
    const eanLimpo = ean.trim();
    const nomeLimpo = nomeProduto.trim();
    const valorNumerico = parseFloat(String(valorProduto).replace(',', '.'));

    if (!eanLimpo || !nomeLimpo || !valorProduto) {
      setErro('Preencha EAN, nome do produto e valor.');
      setTimeout(() => setErro(''), 2000);
      return;
    }

    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro('Informe um valor válido maior que zero.');
      setTimeout(() => setErro(''), 2000);
      return;
    }

    const novoProduto = {
      ean: eanLimpo,
      nome: nomeLimpo.charAt(0).toUpperCase() + nomeLimpo.slice(1),
      valor: valorNumerico,
    };

    if (produtoEditandoIndex !== null) {
      setProdutosColetados(
        produtosColetados.map((produto, index) =>
          index === produtoEditandoIndex ? novoProduto : produto
        )
      );
    } else {
      setProdutosColetados([novoProduto, ...produtosColetados]);
    }

    limparCampos();
  };

  const editarProduto = (index) => {
    const produto = produtosColetados[index];

    setEan(produto.ean);
    setNomeProduto(produto.nome);
    setValorProduto(produto.valor.toString());
    setProdutoEditandoIndex(index);
    setProdutoSelecionadoIndex(null);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const excluirProduto = (index) => {
    setProdutosColetados(produtosColetados.filter((_, i) => i !== index));
    setProdutoSelecionadoIndex(null);
  };

  const handleEnviarMockAPI = async () => {
    if (produtosColetados.length === 0) {
      setErro('Não há produtos para enviar.');
      setTimeout(() => setErro(''), 2000);
      return;
    }

    setEnviando(true);
    setErro('');

    try {
      for (const produto of produtosColetados) {
        await fetch('https://68ed848edf2025af780067e3.mockapi.io/gestor/produtos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(produto),
        });
      }

      setProdutosColetados([]);
      localStorage.removeItem('produtosColetados');
      alert('Produtos enviados com sucesso!');
    } catch (err) {
      console.error(err);
      setErro('Erro ao enviar para o MockAPI.');
    } finally {
      setEnviando(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className={`h-screen w-full flex items-center justify-center ${containerBase}`}>
        <div
          className={`
            w-full max-w-sm mx-4 rounded-3xl border p-8 text-center shadow-xl
            ${cardBase}
          `}
        >
          <div className="text-5xl mb-4">🛑</div>
          <h1 className="text-2xl font-black mb-2">Acesso negado</h1>
          <p className={modoNoturno ? 'text-gray-400' : 'text-gray-500'}>
            Esta tela é exclusiva para administradores.
          </p>

          <button
            onClick={onGoHome}
            className="mt-6 w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black transition"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-full flex overflow-hidden ${containerBase}`}>
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={closeMenu}
        />
      )}

      <SidebarMenu
        menuItems={menuItems}
        accountInfo={accountInfo}
        activeLink="gestor"
        onNavigate={handleNavigation}
        isMenuOpen={isMenuOpen}
        onClose={closeMenu}
      />

      <main className="flex-1 h-screen flex flex-col overflow-hidden">
        <header
          className={`
            md:hidden flex-shrink-0 flex items-center justify-between px-3 py-2.5 z-20 shadow-sm border-b
            ${modoNoturno ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'}
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
            <h1 className="text-base font-black leading-tight">Gestor EAN</h1>
            <p
              className={`text-[9px] font-bold uppercase tracking-[0.18em] ${
                modoNoturno ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Cadastro de produtos
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
                        ? 'bg-purple-500/15 text-purple-300'
                        : 'bg-purple-50 text-purple-700'
                    }
                  `}
                >
                  📦 Gestor de produtos
                </span>

                <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                  Coletor de Produtos - Gestor EAN
                </h1>

                <p
                  className={`mt-1 max-w-2xl text-sm ${
                    modoNoturno ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  Cadastre produtos com código EAN, nome e valor para alimentar sua base de consulta.
                </p>
              </div>
            </div>

            {erro && (
              <div className="flex-shrink-0 p-3 mb-3 text-center rounded-xl bg-red-100 border border-red-400 text-red-800 dark:bg-red-900/50 dark:border-red-600 dark:text-red-300 font-black shadow-sm text-sm">
                {erro}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 flex-1 min-h-0 overflow-hidden">
              <section
                className={`
                  lg:col-span-5 rounded-2xl border shadow-sm flex flex-col overflow-hidden
                  ${cardBase}
                `}
              >
                <div
                  className={`
                    flex-shrink-0 px-4 py-4 border-b
                    ${modoNoturno ? 'border-gray-700' : 'border-gray-200'}
                  `}
                >
                  <h2 className="text-lg font-black">
                    {produtoEditandoIndex !== null ? 'Editar produto' : 'Novo produto'}
                  </h2>

                  <p
                    className={`text-xs mt-1 ${
                      modoNoturno ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Leia o código ou preencha manualmente.
                  </p>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                  {leitorAtivo && (
                    <div>
                      <div className="relative w-full h-56 bg-black rounded-2xl overflow-hidden">
                        <video
                          id="video-gestor-ean"
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          playsInline
                        />

                        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500 transform -translate-y-1/2 pointer-events-none" />
                        <div className="absolute inset-0 border-4 border-green-500 opacity-60 pointer-events-none rounded-2xl" />
                      </div>

                      <p className="text-xs text-gray-400 mt-2">
                        Aponte a câmera para o código de barras. Em celulares, permita o uso da câmera.
                      </p>
                    </div>
                  )}

                  <div>
                    <label
                      className={`block text-xs font-black uppercase tracking-wide mb-2 ${
                        modoNoturno ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      EAN
                    </label>

                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Digite ou leia o código EAN"
                      value={ean}
                      onChange={(e) => setEan(e.target.value)}
                      className={`
                        w-full h-12 px-4 rounded-2xl border outline-none font-semibold transition-all focus:ring-4
                        ${inputBase}
                      `}
                    />
                  </div>

                  <button
                    onClick={() => setLeitorAtivo((prev) => !prev)}
                    className={`
                      w-full h-12 rounded-2xl font-black transition-all active:scale-95 shadow-lg
                      ${
                        leitorAtivo
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                          : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'
                      }
                    `}
                  >
                    {leitorAtivo ? 'Parar leitura' : 'Ler código pela câmera'}
                  </button>

                  <div>
                    <label
                      className={`block text-xs font-black uppercase tracking-wide mb-2 ${
                        modoNoturno ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Nome do produto
                    </label>

                    <input
                      type="text"
                      placeholder="Ex: Arroz 5kg"
                      value={nomeProduto}
                      onChange={(e) => setNomeProduto(e.target.value)}
                      className={`
                        w-full h-12 px-4 rounded-2xl border outline-none font-semibold transition-all focus:ring-4
                        ${inputBase}
                      `}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-xs font-black uppercase tracking-wide mb-2 ${
                        modoNoturno ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Valor
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="R$ 0,00"
                      value={valorProduto}
                      onChange={(e) => setValorProduto(e.target.value)}
                      className={`
                        w-full h-12 px-4 rounded-2xl border outline-none font-semibold transition-all focus:ring-4
                        ${inputBase}
                      `}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handleAddProduto}
                      className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                    >
                      {produtoEditandoIndex !== null ? 'Atualizar' : 'Adicionar'}
                    </button>

                    <button
                      onClick={limparCampos}
                      className={`
                        h-12 rounded-2xl font-black transition-all active:scale-95
                        ${
                          modoNoturno
                            ? 'bg-gray-900 hover:bg-gray-700 text-gray-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }
                      `}
                    >
                      Limpar campos
                    </button>
                  </div>
                </div>
              </section>

              <section
                className={`
                  lg:col-span-7 rounded-2xl border shadow-sm flex flex-col overflow-hidden
                  ${cardBase}
                `}
              >
                <div
                  className={`
                    flex-shrink-0 px-4 py-4 border-b
                    ${modoNoturno ? 'border-gray-700' : 'border-gray-200'}
                  `}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black">Produtos coletados</h2>

                      <p
                        className={`text-xs mt-1 ${
                          modoNoturno ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        {produtosColetados.length === 0
                          ? 'Nenhum produto coletado'
                          : `${produtosColetados.length} produto(s) aguardando envio`}
                      </p>
                    </div>

                    {produtosColetados.length > 0 && (
                      <button
                        onClick={handleEnviarMockAPI}
                        disabled={enviando}
                        className={`
                          px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all active:scale-95
                          ${
                            enviando
                              ? 'bg-purple-400 text-white cursor-not-allowed'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }
                        `}
                      >
                        {enviando ? 'Enviando...' : 'Enviar'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-2 custom-scrollbar">
                  {produtosColetados.length === 0 ? (
                    <div
                      className={`
                        h-full min-h-[260px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center px-6
                        ${
                          modoNoturno
                            ? 'border-gray-700 bg-gray-900/60'
                            : 'border-purple-100 bg-purple-50/40'
                        }
                      `}
                    >
                      <div
                        className={`
                          w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-4
                          ${modoNoturno ? 'bg-gray-800' : 'bg-white'}
                        `}
                      >
                        📦
                      </div>

                      <h3 className="text-lg font-black">Nenhum produto ainda</h3>

                      <p
                        className={`mt-2 max-w-sm text-sm ${
                          modoNoturno ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        Use o formulário ao lado para coletar produtos e depois envie para a base.
                      </p>
                    </div>
                  ) : (
                    produtosColetados.map((produto, index) => {
                      const selecionado = produtoSelecionadoIndex === index;

                      return (
                        <div
                          key={`${produto.ean}-${index}`}
                          onClick={() =>
                            setProdutoSelecionadoIndex(selecionado ? null : index)
                          }
                          className={`
                            relative rounded-2xl border p-3 sm:p-4 cursor-pointer transition-all overflow-hidden
                            ${
                              selecionado
                                ? modoNoturno
                                  ? 'bg-purple-900/40 border-purple-400'
                                  : 'bg-purple-50 border-purple-300'
                                : modoNoturno
                                  ? 'bg-gray-900 border-gray-700 hover:border-purple-500'
                                  : 'bg-white border-gray-200 hover:border-purple-300'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black flex-shrink-0">
                              {index + 1}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-black text-base sm:text-lg truncate">
                                {produto.nome}
                              </p>

                              <p
                                className={`text-xs mt-0.5 truncate ${
                                  modoNoturno ? 'text-gray-400' : 'text-gray-500'
                                }`}
                              >
                                EAN: {produto.ean}
                              </p>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <p className="text-[10px] text-gray-400 uppercase font-black">
                                Valor
                              </p>

                              <p className="text-base sm:text-lg font-black text-green-500">
                                R$ {formatarMoeda(produto.valor)}
                              </p>
                            </div>
                          </div>

                          {selecionado && (
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  editarProduto(index);
                                }}
                                className="h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black transition"
                              >
                                ✎ Editar
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  excluirProduto(index);
                                }}
                                className="h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black transition"
                              >
                                🗑 Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GestorEAN;