import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import SidebarMenu from '../components/SidebarMenu';

const ValorMaximo = ({
  onGoHome,
  modoNoturno,
  onToggleModoNoturno,
  usuarioLogado,
  onLogoutSuccess,
  onSelectOption,
}) => {
  const getInitialValorMaximo = () => {
    return localStorage.getItem('valorMaximo') || '';
  };

  const initialValorMaximo = getInitialValorMaximo();

  const [produtos, setProdutos] = useState([]);
  const [nomeProduto, setNomeProduto] = useState('');
  const [valorProduto, setValorProduto] = useState('');
  const [quantidadeProduto, setQuantidadeProduto] = useState('');
  const [valorMaximo, setValorMaximo] = useState(initialValorMaximo);
  const [erro, setErro] = useState('');
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [produtoSelecionadoIndex, setProdutoSelecionadoIndex] = useState(null);

  const [avisoEstouro, setAvisoEstouro] = useState('');
  const [isBudgetEditing, setIsBudgetEditing] = useState(initialValorMaximo === '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [ean, setEan] = useState('');
  const [leitorAtivo, setLeitorAtivo] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const codeReaderRef = useRef(null);
  const videoRef = useRef(null);

  const isAdmin = usuarioLogado?.role === 'admin';

  const userAccountInfo = {
    username: usuarioLogado?.name || 'Usuário',
    email: usuarioLogado?.email || 'usuario@app.com',
    onLogout: onLogoutSuccess,
    isAdmin,
  };

  const baseMenuOptions = [
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

  const globalMenuOptions = baseMenuOptions.filter((item) => {
    if (item.id === 'gestor' && !isAdmin) return false;
    return true;
  });

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

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

  const formatarMoeda = (valor) => {
    return Number(valor || 0).toFixed(2).replace('.', ',');
  };

  const calcularTotalCompra = (prods = produtos) => {
    return prods.reduce((acc, produto) => acc + Number(produto.total || 0), 0);
  };

  const calcularRestante = () => {
    const valorMaximoFloat = parseFloat(String(valorMaximo).replace(',', '.')) || 0;
    return valorMaximoFloat - calcularTotalCompra();
  };

  useEffect(() => {
    const produtosSalvos = localStorage.getItem('produtosMaximo');

    if (produtosSalvos) {
      try {
        setProdutos(JSON.parse(produtosSalvos));
      } catch (error) {
        console.error('Erro ao carregar produtos salvos:', error);
        setProdutos([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('produtosMaximo', JSON.stringify(produtos));

    const valorMaximoFloat = parseFloat(String(valorMaximo).replace(',', '.')) || 0;
    const totalGeral = calcularTotalCompra(produtos);

    if (totalGeral > valorMaximoFloat && valorMaximoFloat > 0) {
      setAvisoEstouro(
        `⚠️ O valor total R$ ${formatarMoeda(totalGeral)} excedeu o limite de R$ ${formatarMoeda(valorMaximoFloat)}.`
      );
    } else {
      setAvisoEstouro('');
    }
  }, [produtos, valorMaximo]);

  useEffect(() => {
    localStorage.setItem('valorMaximo', valorMaximo);
  }, [valorMaximo]);

  const handleScanClick = () => {
    if (leitorAtivo) {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }

      setLeitorAtivo(false);
    } else {
      setEan('');
      setErro('');
      setLeitorAtivo(true);
    }
  };

  const handleSearchEan = async (codigoEanExterno) => {
    const codigoEan = codigoEanExterno || ean;

    if (!codigoEan) {
      setErro('Informe um código EAN válido.');
      setTimeout(() => setErro(''), 1500);
      return;
    }

    setNomeProduto('');
    setValorProduto('');
    setErro('');

    try {
      const apiKey = '4210726968ED3C18';
      const urlEanData = `https://eandata.com/feed/?v=3&keycode=${apiKey}&mode=json&find=${codigoEan}`;

      const responseEan = await fetch(urlEanData);
      const dataEan = await responseEan.json();

      const produtoValido =
        dataEan &&
        dataEan.product &&
        (dataEan.product.title || dataEan.product.attributes?.product);

      if (produtoValido) {
        const nome =
          dataEan.product.attributes?.product ||
          dataEan.product.title ||
          'Produto não identificado';

        const preco =
          dataEan.product.attributes?.price ||
          dataEan.product.attributes?.msrp ||
          '';

        setEan(codigoEan);
        setNomeProduto(nome);
        setValorProduto(preco ? preco.toString() : '0');

        setTimeout(() => setErro(''), 2000);
        return;
      }

      const mockApiUrl = 'https://68ed848edf2025af780067e3.mockapi.io/gestor/produtos';
      const responseMock = await fetch(`${mockApiUrl}?ean=${codigoEan}`);
      const dataMock = await responseMock.json();

      if (Array.isArray(dataMock) && dataMock.length > 0) {
        const produtoMock = dataMock[0];

        setEan(codigoEan);
        setNomeProduto(produtoMock.nome);
        setValorProduto(produtoMock.valor ? produtoMock.valor.toString() : '0');

        setTimeout(() => setErro(''), 2000);
        return;
      }

      setErro('Produto não encontrado. Preencha manualmente.');
      setNomeProduto('');
      setValorProduto('');

      setTimeout(() => setErro(''), 3000);
    } catch (err) {
      console.error('Erro ao consultar produto:', err);
      setErro('Erro ao consultar o produto. Tente novamente.');
      setTimeout(() => setErro(''), 3000);
    }
  };

  useEffect(() => {
    if (!leitorAtivo) {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }

      return;
    }

    const initScanner = async () => {
      try {
        if (!codeReaderRef.current) {
          codeReaderRef.current = new BrowserMultiFormatReader();
        }

        const codeReader = codeReaderRef.current;

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');

        const backCameras = videoDevices.filter((device) =>
          /back|rear|environment|traseira/i.test(device.label)
        );

        let mainCamera = null;

        if (backCameras.length >= 2) {
          mainCamera = backCameras[1];
        } else if (backCameras.length === 1) {
          mainCamera = backCameras[0];
        } else {
          mainCamera = videoDevices.length > 0 ? videoDevices[0] : null;
        }

        if (!mainCamera && videoDevices.length > 1) {
          mainCamera = videoDevices[1];
        }

        if (!mainCamera) {
          throw new Error('Nenhuma câmera disponível.');
        }

        const constraints = {
          video: {
            deviceId: { exact: mainCamera.deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            advanced: [{ focusMode: 'continuous' }],
          },
        };

        await codeReader.decodeFromConstraints(
          constraints,
          'video-scanner',
          (result, err) => {
            if (result) {
              const capturedEan = result.getText();

              setEan(capturedEan);
              handleSearchEan(capturedEan);

              if (codeReaderRef.current) {
                codeReaderRef.current.reset();
              }

              setLeitorAtivo(false);
            }

            if (err && !(err instanceof NotFoundException)) {
              console.error('Erro durante a leitura:', err);
            }
          }
        );
      } catch (err) {
        console.error('Erro ao acessar a câmera:', err);
        setErro('Erro ao acessar a câmera. Verifique as permissões ou tente outra câmera.');
        setTimeout(() => setErro(''), 3000);
        setLeitorAtivo(false);
      }
    };

    initScanner();

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [leitorAtivo]);

  const handleSetMax = (novoValor) => {
    const valorNumerico = parseFloat(String(novoValor).replace(',', '.'));

    if (!isNaN(valorNumerico) && valorNumerico >= 0) {
      setValorMaximo(novoValor);
      setIsBudgetEditing(false);

      const totalGeral = calcularTotalCompra();

      if (totalGeral > valorNumerico && valorNumerico > 0) {
        setAvisoEstouro(
          `⚠️ O valor total R$ ${formatarMoeda(totalGeral)} excedeu o limite de R$ ${formatarMoeda(valorNumerico)}.`
        );
      } else {
        setAvisoEstouro('');
      }
    } else {
      setErro('Por favor, insira um valor numérico positivo.');
      setTimeout(() => setErro(''), 3000);
    }
  };

  const handleOpenModal = (index = null) => {
    if (index === null && !valorMaximo) {
      setErro('Por favor, defina o valor máximo antes de adicionar um produto.');
      setTimeout(() => setErro(''), 5000);
      return;
    }

    if (index !== null) {
      const produto = produtos[index];

      setEan(produto.ean || '');
      setNomeProduto(produto.nome);
      setValorProduto(produto.valor.toString());
      setQuantidadeProduto(produto.quantidade.toString());
      setEditandoIndex(index);
    } else {
      setNomeProduto('');
      setValorProduto('');
      setQuantidadeProduto('');
      setEditandoIndex(null);
      setEan('');
    }

    if (leitorAtivo) {
      handleScanClick();
    }

    setErro('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNomeProduto('');
    setValorProduto('');
    setQuantidadeProduto('');
    setEditandoIndex(null);
    setEan('');

    if (leitorAtivo) {
      handleScanClick();
    }

    setErro('');
  };

  const handleAddProduto = () => {
    if (!nomeProduto || !valorProduto || !quantidadeProduto) {
      setErro('Por favor, preencha todos os campos.');
      setTimeout(() => setErro(''), 3000);
      return;
    }

    const novoValor = parseFloat(String(valorProduto).replace(',', '.'));
    const novaQtd = parseInt(quantidadeProduto);

    if (isNaN(novoValor) || isNaN(novaQtd) || novoValor <= 0 || novaQtd <= 0) {
      setErro('Valor e quantidade devem ser números positivos válidos.');
      setTimeout(() => setErro(''), 3000);
      return;
    }

    const novoProduto = {
      ean: ean || null,
      nome: nomeProduto,
      valor: novoValor,
      quantidade: novaQtd,
      total: novoValor * novaQtd,
    };

    const totalAtualSemEste =
      editandoIndex !== null
        ? calcularTotalCompra() - produtos[editandoIndex].total
        : calcularTotalCompra();

    const novoTotalGeral = totalAtualSemEste + novoProduto.total;
    const valorMaximoFloat = parseFloat(String(valorMaximo).replace(',', '.')) || 0;

    if (valorMaximoFloat > 0 && novoTotalGeral > valorMaximoFloat) {
      setErro(
        `Este produto excederá o limite de R$ ${formatarMoeda(valorMaximoFloat)} em R$ ${formatarMoeda(novoTotalGeral - valorMaximoFloat)}.`
      );
      return;
    }

    if (editandoIndex !== null) {
      const produtosAtualizados = produtos.map((produto, index) =>
        index === editandoIndex ? novoProduto : produto
      );

      setProdutos(produtosAtualizados);
    } else {
      setProdutos([...produtos, novoProduto]);
    }

    setErro('');
    handleCloseModal();
    setProdutoSelecionadoIndex(null);
  };

  const handleEditProduto = (index) => {
    setProdutoSelecionadoIndex(null);
    handleOpenModal(index);
  };

  const handleDeleteProduto = (index) => {
    setProdutos(produtos.filter((_, i) => i !== index));
    setProdutoSelecionadoIndex(null);
  };

  const handleRowClick = (index) => {
    setProdutoSelecionadoIndex(index === produtoSelecionadoIndex ? null : index);
  };

  const valorMaximoFloat = parseFloat(String(valorMaximo).replace(',', '.')) || 1;
  const totalGasto = calcularTotalCompra();
  const percentual = Math.min((totalGasto / valorMaximoFloat) * 100, 100);

  const corProgresso =
    totalGasto > valorMaximoFloat
      ? 'bg-red-700'
      : percentual >= 90
        ? 'bg-red-500'
        : percentual >= 70
          ? 'bg-yellow-500'
          : 'bg-green-500';

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
        activeLink="valorMaximo"
        onNavigate={handleNavigation}
        isMenuOpen={isMenuOpen}
        onClose={closeMenu}
      />

      <main className="flex-1 h-screen flex flex-col overflow-hidden">
        <header
          className={`
            md:hidden flex-shrink-0 flex items-center justify-between px-4 py-3 z-20 shadow-sm border-b
            ${modoNoturno ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'}
          `}
        >
          <button
            onClick={toggleMenu}
            className={`
              w-11 h-11 rounded-2xl text-2xl flex items-center justify-center shadow-sm
              ${modoNoturno ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
            `}
          >
            ☰
          </button>

          <div className="text-center">
            <h1 className="text-lg font-black leading-tight">Limite</h1>
            <p
              className={`
                text-[10px] font-bold uppercase tracking-[0.2em]
                ${modoNoturno ? 'text-gray-400' : 'text-gray-500'}
              `}
            >
              Valor máximo
            </p>
          </div>

          <div className="w-11" />
        </header>

        <div className="flex-1 min-h-0 overflow-hidden p-3 sm:p-5 lg:p-6">
          <div className="max-w-5xl mx-auto h-full flex flex-col min-h-0 overflow-hidden">
            {erro && !isModalOpen && (
              <div className="flex-shrink-0 p-3 mb-3 text-center rounded-xl bg-red-100 border border-red-400 text-red-800 dark:bg-red-900/50 dark:border-red-600 dark:text-red-300 font-black shadow-sm text-sm">
                {erro}
              </div>
            )}

            {avisoEstouro && (
              <div className="flex-shrink-0 p-3 mb-3 text-center rounded-xl bg-red-100 border border-red-400 text-red-800 dark:bg-red-900/50 dark:border-red-600 dark:text-red-300 font-black shadow-sm text-sm">
                {avisoEstouro}
              </div>
            )}

            <div
              className={`
                flex-shrink-0 rounded-2xl border shadow-sm px-4 py-4 mb-4
                ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-start">
                <div className="hidden md:block lg:col-span-5">
                  <span
                    className={`
                      inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black mb-2
                      ${modoNoturno ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-700'}
                    `}
                  >
                    💸 Controle de limite
                  </span>

                  <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                    Gerenciador de limite de gastos
                  </h1>

                  <p
                    className={`
                      mt-1 max-w-xl text-sm
                      ${modoNoturno ? 'text-gray-300' : 'text-gray-600'}
                    `}
                  >
                    Defina um valor máximo e acompanhe seus produtos sem perder a lista de vista.
                  </p>
                </div>

                <div className="lg:col-span-7">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p
                        className={`
                          text-[11px] font-black uppercase tracking-wide mb-1
                          ${modoNoturno ? 'text-gray-400' : 'text-gray-500'}
                        `}
                      >
                        Valor máximo definido
                      </p>

                      <h2 className="text-xl sm:text-2xl font-black">
                        {isBudgetEditing || !valorMaximo
                          ? 'Defina o valor máximo'
                          : `R$ ${formatarMoeda(parseFloat(valorMaximo || 0))}`}
                      </h2>
                    </div>

                    {!isBudgetEditing && (
                      <button
                        onClick={() => setIsBudgetEditing(true)}
                        className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition"
                        title="Editar valor máximo"
                      >
                        ✎
                      </button>
                    )}
                  </div>

                  {isBudgetEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="R$ 0,00"
                        value={valorMaximo}
                        onChange={(e) => setValorMaximo(e.target.value)}
                        className={`
                          sm:col-span-2 h-11 rounded-xl border px-4 font-bold outline-none focus:ring-4
                          ${
                            modoNoturno
                              ? 'bg-gray-900 border-gray-700 text-gray-100 focus:ring-blue-500/20'
                              : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-blue-500/20'
                          }
                        `}
                      />

                      <button
                        onClick={() => handleSetMax(valorMaximo)}
                        className="h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black transition"
                      >
                        Salvar
                      </button>
                    </div>
                  ) : (
                    valorMaximo && (
                      <div className="mt-3">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div
                            className={`
                              rounded-xl p-3 border
                              ${modoNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}
                            `}
                          >
                            <p
                              className={`
                                text-[11px] font-black uppercase tracking-wide
                                ${modoNoturno ? 'text-gray-400' : 'text-gray-500'}
                              `}
                            >
                              Gasto atual
                            </p>

                            <p className="text-lg sm:text-xl font-black text-green-500 mt-1">
                              R$ {formatarMoeda(calcularTotalCompra())}
                            </p>
                          </div>

                          <div
                            className={`
                              rounded-xl p-3 border
                              ${modoNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}
                            `}
                          >
                            <p
                              className={`
                                text-[11px] font-black uppercase tracking-wide
                                ${modoNoturno ? 'text-gray-400' : 'text-gray-500'}
                              `}
                            >
                              Restante
                            </p>

                            <p
                              className={`
                                text-lg sm:text-xl font-black mt-1
                                ${calcularRestante() < 0 ? 'text-red-500' : 'text-blue-500'}
                              `}
                            >
                              R$ {formatarMoeda(calcularRestante())}
                            </p>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`${corProgresso} h-2.5 rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(percentual, 100)}%` }}
                          />
                        </div>

                        <p
                          className={`
                            text-[11px] text-right mt-1 font-bold
                            ${modoNoturno ? 'text-gray-400' : 'text-gray-500'}
                          `}
                        >
                          {totalGasto > valorMaximoFloat
                            ? `Estourou: ${((totalGasto / valorMaximoFloat) * 100).toFixed(1)}% do limite.`
                            : `${percentual.toFixed(1)}% do limite usado.`}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <section
              className={`
                flex-1 min-h-0 rounded-3xl border-2 shadow-xl overflow-hidden flex flex-col
                ${
                  modoNoturno
                    ? 'bg-gray-800 border-blue-500/40 shadow-blue-950/30'
                    : 'bg-white border-blue-200 shadow-blue-100/80'
                }
              `}
            >
              <div
                className={`
                  flex-shrink-0 px-4 py-4 border-b
                  ${
                    modoNoturno
                      ? 'border-blue-500/30 bg-gradient-to-r from-blue-950/60 via-gray-900/70 to-gray-900'
                      : 'border-blue-100 bg-gradient-to-r from-blue-50 via-white to-green-50'
                  }
                `}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl shadow-lg flex-shrink-0">
                      🛒
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-black">
                          Lista de itens
                        </h2>

                        <span
                          className={`
                            px-2.5 py-1 rounded-full text-[11px] font-black
                            ${
                              modoNoturno
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                            }
                          `}
                        >
                          {produtos.length} produto(s)
                        </span>
                      </div>

                      <p
                        className={`
                          text-sm mt-1
                          ${modoNoturno ? 'text-gray-300' : 'text-gray-600'}
                        `}
                      >
                        {produtos.length === 0
                          ? 'Adicione produtos para acompanhar sua compra em tempo real.'
                          : 'Confira os itens adicionados. Clique em um produto para editar ou excluir.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenModal()}
                    disabled={!valorMaximo}
                    className={`
                      w-full lg:w-auto px-5 py-3 rounded-2xl text-sm font-black transition-all shadow-lg active:scale-95
                      ${
                        !valorMaximo
                          ? 'bg-blue-400/50 text-white cursor-not-allowed shadow-none'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25'
                      }
                    `}
                  >
                    + Adicionar produto
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar p-3 sm:p-4">
                {produtos.length === 0 ? (
                  <div
                    className={`
                      h-full min-h-[260px] flex flex-col items-center justify-center text-center px-6 py-8 rounded-2xl border-2 border-dashed
                      ${
                        modoNoturno
                          ? 'border-gray-700 bg-gray-900/60'
                          : 'border-blue-100 bg-blue-50/50'
                      }
                    `}
                  >
                    <div
                      className={`
                        w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-4 shadow-sm
                        ${modoNoturno ? 'bg-gray-800' : 'bg-white'}
                      `}
                    >
                      📝
                    </div>

                    <h3 className="text-xl font-black">Sua lista ainda está vazia</h3>

                    <p
                      className={`
                        mt-2 max-w-sm text-sm
                        ${modoNoturno ? 'text-gray-400' : 'text-gray-600'}
                      `}
                    >
                      Defina o valor máximo e clique em <strong>+ Adicionar produto</strong> para começar sua compra.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      className={`
                        hidden md:grid grid-cols-12 gap-3 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide
                        ${
                          modoNoturno
                            ? 'bg-gray-900 text-gray-400'
                            : 'bg-gray-100 text-gray-500'
                        }
                      `}
                    >
                      <div className="col-span-5">Produto</div>
                      <div className="col-span-2 text-right">Valor und.</div>
                      <div className="col-span-2 text-center">Qtd.</div>
                      <div className="col-span-3 text-right">Total</div>
                    </div>

                    {produtos.map((produto, index) => {
                      const selecionado = index === produtoSelecionadoIndex;

                      return (
                        <div
                          key={index}
                          onClick={() => handleRowClick(index)}
                          className={`
                            relative cursor-pointer rounded-2xl border transition-all overflow-hidden
                            ${
                              selecionado
                                ? modoNoturno
                                  ? 'bg-blue-900/50 border-blue-400 shadow-lg shadow-blue-950/30'
                                  : 'bg-blue-50 border-blue-400 shadow-lg shadow-blue-100'
                                : modoNoturno
                                  ? 'bg-gray-900 border-gray-700 hover:border-blue-500 hover:bg-gray-900/80'
                                  : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                            }
                          `}
                        >
                          <div
                            className={`
                              absolute left-0 top-0 h-full w-1.5
                              ${
                                selecionado
                                  ? 'bg-blue-600'
                                  : index % 2 === 0
                                    ? 'bg-green-500'
                                    : 'bg-blue-500'
                              }
                            `}
                          />

                          <div className="hidden md:grid grid-cols-12 gap-3 items-center px-5 py-4">
                            <div className="col-span-5 min-w-0 pl-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`
                                    w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0
                                    ${
                                      modoNoturno
                                        ? 'bg-gray-800 text-blue-300'
                                        : 'bg-blue-50 text-blue-700'
                                    }
                                  `}
                                >
                                  {index + 1}
                                </div>

                                <div className="min-w-0">
                                  <p className="font-black truncate">{produto.nome}</p>

                                  {produto.ean && (
                                    <p
                                      className={`
                                        text-[11px] mt-0.5
                                        ${modoNoturno ? 'text-gray-400' : 'text-gray-500'}
                                      `}
                                    >
                                      EAN: {produto.ean}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="col-span-2 text-right font-bold">
                              R$ {formatarMoeda(produto.valor)}
                            </div>

                            <div className="col-span-2 text-center">
                              <span
                                className={`
                                  inline-flex min-w-10 justify-center px-3 py-1 rounded-full font-black
                                  ${
                                    modoNoturno
                                      ? 'bg-gray-800 text-gray-100'
                                      : 'bg-gray-100 text-gray-800'
                                  }
                                `}
                              >
                                {produto.quantidade}
                              </span>
                            </div>

                            <div className="col-span-3 text-right text-lg font-black text-green-500">
                              R$ {formatarMoeda(produto.total)}
                            </div>
                          </div>

                          <div className="md:hidden p-4 pl-5">
                            <div className="flex items-start gap-3 mb-3">
                              <div
                                className={`
                                  w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0
                                  ${
                                    modoNoturno
                                      ? 'bg-gray-800 text-blue-300'
                                      : 'bg-blue-50 text-blue-700'
                                  }
                                `}
                              >
                                {index + 1}
                              </div>

                              <div className="min-w-0">
                                <div className="font-black text-lg leading-tight">
                                  {produto.nome}
                                </div>

                                {produto.ean && (
                                  <p
                                    className={`
                                      text-[11px] mt-1
                                      ${modoNoturno ? 'text-gray-400' : 'text-gray-500'}
                                    `}
                                  >
                                    EAN: {produto.ean}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div
                                className={`
                                  rounded-xl p-2
                                  ${modoNoturno ? 'bg-gray-800' : 'bg-gray-50'}
                                `}
                              >
                                <p className={modoNoturno ? 'text-gray-400' : 'text-gray-500'}>
                                  Valor
                                </p>
                                <p className="font-black">
                                  R$ {formatarMoeda(produto.valor)}
                                </p>
                              </div>

                              <div
                                className={`
                                  rounded-xl p-2 text-center
                                  ${modoNoturno ? 'bg-gray-800' : 'bg-gray-50'}
                                `}
                              >
                                <p className={modoNoturno ? 'text-gray-400' : 'text-gray-500'}>
                                  Qtd.
                                </p>
                                <p className="font-black">{produto.quantidade}</p>
                              </div>

                              <div
                                className={`
                                  rounded-xl p-2 text-right
                                  ${modoNoturno ? 'bg-gray-800' : 'bg-gray-50'}
                                `}
                              >
                                <p className={modoNoturno ? 'text-gray-400' : 'text-gray-500'}>
                                  Total
                                </p>
                                <p className="font-black text-green-500">
                                  R$ {formatarMoeda(produto.total)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {selecionado && (
                            <div
                              className={`
                                absolute top-1/2 right-4 -translate-y-1/2 flex gap-2 z-20 p-2 rounded-xl shadow-lg backdrop-blur-sm
                                ${modoNoturno ? 'bg-gray-950/90' : 'bg-white/90'}
                              `}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditProduto(index);
                                }}
                                className="w-9 h-9 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-black transition flex items-center justify-center"
                                title="Editar"
                              >
                                ✎
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProduto(index);
                                }}
                                className="w-9 h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black transition flex items-center justify-center"
                                title="Excluir"
                              >
                                🗑
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="h-2" />
                  </div>
                )}
              </div>

              {produtos.length > 0 && (
                <div
                  className={`
                    flex-shrink-0 border-t px-4 py-3
                    ${
                      modoNoturno
                        ? 'border-blue-500/30 bg-gray-950/80'
                        : 'border-blue-100 bg-gradient-to-r from-blue-50 to-green-50'
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p
                        className={`
                          text-[11px] font-black uppercase tracking-wide
                          ${modoNoturno ? 'text-gray-400' : 'text-gray-500'}
                        `}
                      >
                        Total da lista
                      </p>

                      <p className="text-2xl font-black text-green-500">
                        R$ {formatarMoeda(calcularTotalCompra())}
                      </p>
                    </div>

                    <div
                      className={`
                        hidden sm:block text-right text-xs font-bold
                        ${modoNoturno ? 'text-gray-400' : 'text-gray-500'}
                      `}
                    >
                      {produtos.length} item(ns) adicionados
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {isModalOpen && (
          <div
            className={`
              fixed inset-0 z-50 flex justify-center items-center p-4 transition-all
              ${modoNoturno ? 'bg-gray-900/90 text-gray-100' : 'bg-black/70 text-gray-900'}
            `}
          >
            <div
              className={`
                w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[2rem] shadow-2xl border p-6 sm:p-8
                ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-600 text-white flex items-center justify-center text-4xl mb-5 shadow-lg">
                  {editandoIndex !== null ? '✎' : '+'}
                </div>

                <h1 className="text-2xl font-black">
                  {editandoIndex !== null ? 'Editar Produto' : 'Adicionar Produto'}
                </h1>

                <p
                  className={`text-sm mt-2 ${
                    modoNoturno ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  Preencha os dados do produto ou use o leitor de código de barras.
                </p>
              </div>

              {leitorAtivo && (
                <div className="mb-4">
                  <div className="relative w-full h-52 bg-black rounded-2xl overflow-hidden">
                    <video
                      id="video-scanner"
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                    />

                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500 transform -translate-y-1/2 pointer-events-none" />
                    <div className="absolute inset-0 border-4 border-green-500 opacity-60 pointer-events-none rounded-2xl" />
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Aponte a câmera para o código de barras EAN.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <input
                  type="number"
                  placeholder="EAN do produto opcional"
                  value={ean}
                  onChange={(e) => setEan(e.target.value)}
                  className={`
                    h-12 border rounded-2xl px-4 font-semibold focus:ring-4 focus:outline-none transition
                    ${
                      modoNoturno
                        ? 'bg-gray-900 border-gray-700 text-gray-100 focus:ring-blue-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-700 focus:ring-blue-500/20'
                    }
                  `}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSearchEan()}
                    className="h-12 font-black rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                  >
                    Buscar EAN
                  </button>

                  <button
                    onClick={handleScanClick}
                    className={`
                      h-12 font-black rounded-2xl shadow-sm transition-all active:scale-95
                      ${
                        leitorAtivo
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }
                    `}
                  >
                    {leitorAtivo ? 'Parar leitura' : 'Ler código'}
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Nome do produto"
                  value={nomeProduto}
                  onChange={(e) => setNomeProduto(e.target.value)}
                  className={`
                    h-12 border rounded-2xl px-4 font-semibold focus:ring-4 focus:outline-none transition
                    ${
                      modoNoturno
                        ? 'bg-gray-900 border-gray-700 text-gray-100 focus:ring-blue-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-700 focus:ring-blue-500/20'
                    }
                  `}
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Valor R$"
                    value={valorProduto}
                    onChange={(e) => setValorProduto(e.target.value)}
                    className={`
                      h-12 border rounded-2xl px-4 font-semibold focus:ring-4 focus:outline-none transition
                      ${
                        modoNoturno
                          ? 'bg-gray-900 border-gray-700 text-gray-100 focus:ring-blue-500/20'
                          : 'bg-gray-50 border-gray-200 text-gray-700 focus:ring-blue-500/20'
                      }
                    `}
                  />

                  <input
                    type="number"
                    placeholder="Qtd."
                    value={quantidadeProduto}
                    onChange={(e) => setQuantidadeProduto(e.target.value)}
                    className={`
                      h-12 border rounded-2xl px-4 font-semibold focus:ring-4 focus:outline-none transition
                      ${
                        modoNoturno
                          ? 'bg-gray-900 border-gray-700 text-gray-100 focus:ring-blue-500/20'
                          : 'bg-gray-50 border-gray-200 text-gray-700 focus:ring-blue-500/20'
                      }
                    `}
                  />
                </div>

                {erro && (
                  <p className="text-red-500 font-black text-sm text-center">
                    {erro}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleAddProduto}
                    className="h-12 font-black rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                  >
                    {editandoIndex !== null ? 'Atualizar Produto' : 'Adicionar Produto'}
                  </button>

                  <button
                    onClick={handleCloseModal}
                    disabled={leitorAtivo}
                    className={`
                      h-12 font-black rounded-2xl shadow-sm transition-all active:scale-95
                      ${
                        leitorAtivo
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }
                    `}
                  >
                    {leitorAtivo ? 'Leitor ativo...' : 'Cancelar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ValorMaximo;