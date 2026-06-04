import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../components/ThemeContext';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import SidebarMenu from '../components/SidebarMenu';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SomarValor = ({
  items = [],
  onGoHome,
  usuarioLogado,
  onLogoutSuccess,
  onToggleModoNoturno,
  onSelectOption,
}) => {
  const { modoNoturno, toggleModoNoturno } = useTheme();

  const isAdmin = usuarioLogado?.role === 'admin';
  const userEmail = usuarioLogado?.email || 'usuario@sistema.com';
  const userName = usuarioLogado?.name || (isAdmin ? 'Admin' : 'Usuário Comum');

  const [produtos, setProdutos] = useState([]);
  const [ean, setEan] = useState('');
  const [nomeProduto, setNomeProduto] = useState('');
  const [valorProduto, setValorProduto] = useState('');
  const [quantidadeProduto, setQuantidadeProduto] = useState('');
  const [erro, setErro] = useState('');

  const [editandoIndex, setEditandoIndex] = useState(null);
  const [produtoSelecionadoIndex, setProdutoSelecionadoIndex] = useState(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [modalExportarOpen, setModalExportarOpen] = useState(false);
  const [exibirModalConfirmacao, setExibirModalConfirmacao] = useState(false);

  const [leitorAtivo, setLeitorAtivo] = useState(false);
  const codeReaderRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  const formatarMoeda = (valor) => {
    return Number(valor || 0).toFixed(2).replace('.', ',');
  };

  const calcularTotalCompra = (lista = produtos) => {
    return lista.reduce((acc, produto) => acc + Number(produto.total || 0), 0);
  };

  const limparCamposModal = () => {
    setEan('');
    setNomeProduto('');
    setValorProduto('');
    setQuantidadeProduto('');
    setErro('');
    setEditandoIndex(null);

    if (leitorAtivo) {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }

      setLeitorAtivo(false);
    }
  };

  const abrirModalAdicionar = () => {
    limparCamposModal();
    setIsOpen(true);
  };

  const fecharModal = () => {
    limparCamposModal();
    setIsOpen(false);
  };

  const handleLogout = () => {
    if (onLogoutSuccess) {
      onLogoutSuccess();
    } else {
      alert('Sessão encerrada.');
    }
  };

  const handleNavigation = (pageId) => {
    closeMenu();

    if (pageId === 'home') {
      onGoHome?.();
      return;
    }

    if (pageId === 'themeToggle') {
      if (onToggleModoNoturno) {
        onToggleModoNoturno();
      } else {
        toggleModoNoturno();
      }

      return;
    }

    if (pageId === 'gestor') {
      if (!isAdmin) {
        alert('Acesso negado: Você não tem permissão de administrador.');
        return;
      }

      onSelectOption?.('gestor', '');
      return;
    }
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

  const userAccountInfo = {
    username: userName,
    email: userEmail,
    onLogout: handleLogout,
    isAdmin,
  };

  useEffect(() => {
    if (items && items.length > 0) {
      const itensConvertidos = items.map((item) => ({
        ean: item.ean || null,
        nome: item.nome,
        valor: Number(item.valor || 0),
        quantidade: Number(item.quantidade || 1),
        total: Number(item.total || Number(item.valor || 0) * Number(item.quantidade || 1)),
      }));

      setProdutos(itensConvertidos);
      return;
    }

    const produtosSalvos = localStorage.getItem('produtos');

    if (produtosSalvos) {
      try {
        setProdutos(JSON.parse(produtosSalvos));
      } catch (error) {
        console.error('Erro ao carregar produtos salvos:', error);
        setProdutos([]);
      }
    }
  }, [items]);

  useEffect(() => {
    localStorage.setItem('produtos', JSON.stringify(produtos));
  }, [produtos]);

  const buscarProdutoPorEan = async (codigoEan) => {
    if (!codigoEan) {
      setErro('Informe um código EAN válido.');
      setTimeout(() => setErro(''), 1500);
      return;
    }

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

        setNomeProduto(nome);
        setValorProduto(preco ? preco.toString() : '0');
        setErro('');
        return;
      }

      const mockApiUrl = 'https://68ed848edf2025af780067e3.mockapi.io/gestor/produtos';
      const responseMock = await fetch(`${mockApiUrl}?ean=${codigoEan}`);
      const dataMock = await responseMock.json();

      if (Array.isArray(dataMock) && dataMock.length > 0) {
        const produtoMock = dataMock[0];

        setNomeProduto(produtoMock.nome);
        setValorProduto(produtoMock.valor ? produtoMock.valor.toString() : '0');
        setErro('');
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
          'video-scanner-somar',
          (result, err) => {
            if (result) {
              const codigo = result.getText();

              setEan(codigo);
              buscarProdutoPorEan(codigo);

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

  const handleAddProduto = () => {
    if (!nomeProduto || !valorProduto || !quantidadeProduto) {
      setErro('Por favor, preencha todos os campos.');
      setTimeout(() => setErro(''), 2000);
      return;
    }

    const valorNumerico = parseFloat(String(valorProduto).replace(',', '.'));
    const quantidadeNumerica = parseInt(quantidadeProduto);

    if (
      isNaN(valorNumerico) ||
      isNaN(quantidadeNumerica) ||
      valorNumerico <= 0 ||
      quantidadeNumerica <= 0
    ) {
      setErro('Valor e quantidade devem ser números positivos válidos.');
      setTimeout(() => setErro(''), 2500);
      return;
    }

    const novoProduto = {
      ean: ean || null,
      nome: nomeProduto.trim(),
      valor: valorNumerico,
      quantidade: quantidadeNumerica,
      total: valorNumerico * quantidadeNumerica,
    };

    if (editandoIndex !== null) {
      const produtosAtualizados = produtos.map((produto, index) =>
        index === editandoIndex ? novoProduto : produto
      );

      setProdutos(produtosAtualizados);
    } else {
      setProdutos([novoProduto, ...produtos]);
    }

    limparCamposModal();
    setIsOpen(false);
    setProdutoSelecionadoIndex(null);
  };

  const handleEditProduto = (index) => {
    const produto = produtos[index];

    setEan(produto.ean || '');
    setNomeProduto(produto.nome);
    setValorProduto(produto.valor.toString());
    setQuantidadeProduto(produto.quantidade.toString());
    setEditandoIndex(index);
    setProdutoSelecionadoIndex(null);
    setIsOpen(true);
  };

  const handleDeleteProduto = (index) => {
    setProdutos(produtos.filter((_, i) => i !== index));
    setProdutoSelecionadoIndex(null);
  };

  const handleRowClick = (index) => {
    setProdutoSelecionadoIndex(index === produtoSelecionadoIndex ? null : index);
  };

  const handleLimparLista = () => {
    if (produtos.length === 0) return;
    setExibirModalConfirmacao(true);
  };

  const confirmarLimpeza = () => {
    setProdutos([]);
    setProdutoSelecionadoIndex(null);
    localStorage.removeItem('produtos');
    setExibirModalConfirmacao(false);
  };

  const exportarExcel = () => {
    if (produtos.length === 0) {
      setErro('Não há produtos para exportar.');
      setTimeout(() => setErro(''), 2000);
      return;
    }

    const dados = produtos.map((produto) => ({
      EAN: produto.ean || '-',
      Produto: produto.nome,
      'Valor Unitário': produto.valor,
      Quantidade: produto.quantidade,
      Total: produto.total,
    }));

    dados.push({
      EAN: '',
      Produto: 'TOTAL GERAL',
      'Valor Unitário': '',
      Quantidade: '',
      Total: calcularTotalCompra(),
    });

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lista de Compras');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const data = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(data, 'lista-compras.xlsx');
  };

  const exportarPDF = () => {
    if (produtos.length === 0) {
      setErro('Não há produtos para exportar.');
      setTimeout(() => setErro(''), 2000);
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Relatório de Gestão de Compras', 14, 15);

    const tableRows = produtos.map((produto) => [
      produto.ean || '-',
      produto.nome,
      `R$ ${formatarMoeda(produto.valor)}`,
      produto.quantidade,
      `R$ ${formatarMoeda(produto.total)}`,
    ]);

    autoTable(doc, {
      head: [['EAN', 'Produto', 'Valor Unit.', 'Qtd', 'Total']],
      body: tableRows,
      startY: 25,
    });

    const finalY = doc.lastAutoTable?.finalY || 30;

    doc.text(
      `TOTAL GERAL: R$ ${formatarMoeda(calcularTotalCompra())}`,
      14,
      finalY + 10
    );

    doc.save('lista-produtos.pdf');
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
        activeLink="somar"
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
            <h1 className="text-base font-black leading-tight">Lista de Compra</h1>
            <p
              className={`text-[9px] font-bold uppercase tracking-[0.18em] ${
                modoNoturno ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Somar valor
            </p>
          </div>

          <div className="w-10" />
        </header>

        <div className="flex-1 min-h-0 overflow-hidden p-2 sm:p-5 lg:p-6">
          <div className="max-w-5xl mx-auto h-full flex flex-col min-h-0 overflow-hidden">
            {erro && !isOpen && (
              <div className="flex-shrink-0 p-3 mb-3 text-center rounded-xl bg-red-100 border border-red-400 text-red-800 dark:bg-red-900/50 dark:border-red-600 dark:text-red-300 font-black shadow-sm text-sm">
                {erro}
              </div>
            )}

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
                        ? 'bg-blue-500/15 text-blue-300'
                        : 'bg-blue-50 text-blue-700'
                    }
                  `}
                >
                  🧮 Modo soma
                </span>

                <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                  Sua lista de compras
                </h1>

                <p
                  className={`mt-1 max-w-2xl text-sm ${
                    modoNoturno ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  Adicione os produtos comprados e acompanhe o total em tempo real.
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
                <span>Adicionar produto</span>
              </button>
            </div>

            <section
              className={`
                flex-1 min-h-0 rounded-2xl sm:rounded-3xl border-2 shadow-xl overflow-hidden flex flex-col
                ${
                  modoNoturno
                    ? 'bg-gray-800 border-blue-500/40 shadow-blue-950/30'
                    : 'bg-white border-blue-200 shadow-blue-100/80'
                }
              `}
            >
              <div
                className={`
                  flex-shrink-0 px-3 py-3 sm:px-4 sm:py-4 border-b
                  ${
                    modoNoturno
                      ? 'border-blue-500/30 bg-gradient-to-r from-blue-950/60 via-gray-900/70 to-gray-900'
                      : 'border-blue-100 bg-gradient-to-r from-blue-50 via-white to-green-50'
                  }
                `}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl sm:text-2xl shadow-lg flex-shrink-0">
                      🛒
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-black leading-tight">
                          Produtos da compra
                        </h2>

                        <span
                          className={`
                            px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black
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
                        className={`text-xs sm:text-sm mt-0.5 line-clamp-1 ${
                          modoNoturno ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        {produtos.length === 0
                          ? 'Adicione produtos para iniciar a soma.'
                          : 'Toque em um produto para editar ou excluir.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {produtos.length > 0 && (
                      <button
                        onClick={handleLimparLista}
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

                    {produtos.length > 0 && (
                      <button
                        onClick={() => setModalExportarOpen(true)}
                        className="
                          hidden sm:inline-flex px-3 py-2.5 rounded-xl bg-gray-700 hover:bg-green-700 text-white
                          text-xs font-black transition-all active:scale-95
                        "
                      >
                        Exportar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar p-2 sm:p-4">
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
                        w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl mb-4 shadow-sm
                        ${modoNoturno ? 'bg-gray-800' : 'bg-white'}
                      `}
                    >
                      🛒
                    </div>

                    <h3 className="text-lg sm:text-xl font-black">
                      Sua lista está vazia
                    </h3>

                    <p
                      className={`mt-2 max-w-sm text-xs sm:text-sm ${
                        modoNoturno ? 'text-gray-400' : 'text-gray-600'
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
                      + Adicionar primeiro produto
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    <div
                      className={`
                        hidden md:grid grid-cols-12 gap-3 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide
                        ${modoNoturno ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-500'}
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
                          key={`${produto.nome}-${index}`}
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
                              ${selecionado ? 'bg-blue-600' : index % 2 === 0 ? 'bg-green-500' : 'bg-blue-500'}
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
                                      className={`text-[11px] mt-0.5 ${
                                        modoNoturno ? 'text-gray-400' : 'text-gray-500'
                                      }`}
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

                          <div className="md:hidden p-3 pl-5">
                            <div className="flex items-start gap-2 mb-2">
                              <div
                                className={`
                                  w-9 h-9 rounded-xl flex items-center justify-center font-black flex-shrink-0 text-sm
                                  ${
                                    modoNoturno
                                      ? 'bg-gray-800 text-blue-300'
                                      : 'bg-blue-50 text-blue-700'
                                  }
                                `}
                              >
                                {index + 1}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="font-black text-base leading-tight truncate">
                                  {produto.nome}
                                </div>

                                {produto.ean && (
                                  <p
                                    className={`text-[10px] mt-0.5 truncate ${
                                      modoNoturno ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                                  >
                                    EAN: {produto.ean}
                                  </p>
                                )}
                              </div>

                              <div className="text-right flex-shrink-0">
                                <p className="text-[10px] text-gray-400 leading-none">Total</p>
                                <p className="font-black text-green-500 text-sm">
                                  R$ {formatarMoeda(produto.total)}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div
                                className={`rounded-xl px-2 py-1.5 ${
                                  modoNoturno ? 'bg-gray-800' : 'bg-gray-50'
                                }`}
                              >
                                <p className={modoNoturno ? 'text-gray-400' : 'text-gray-500'}>
                                  Valor
                                </p>
                                <p className="font-black">
                                  R$ {formatarMoeda(produto.valor)}
                                </p>
                              </div>

                              <div
                                className={`rounded-xl px-2 py-1.5 text-center ${
                                  modoNoturno ? 'bg-gray-800' : 'bg-gray-50'
                                }`}
                              >
                                <p className={modoNoturno ? 'text-gray-400' : 'text-gray-500'}>
                                  Qtd.
                                </p>
                                <p className="font-black">{produto.quantidade}</p>
                              </div>
                            </div>

                            {selecionado && (
                              <div className="grid grid-cols-2 gap-2 mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditProduto(index);
                                  }}
                                  className="h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black transition flex items-center justify-center"
                                >
                                  ✎ Editar
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProduto(index);
                                  }}
                                  className="h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black transition flex items-center justify-center"
                                >
                                  🗑 Excluir
                                </button>
                              </div>
                            )}
                          </div>

                          {selecionado && (
                            <div
                              className={`
                                hidden md:flex absolute top-1/2 right-4 -translate-y-1/2 gap-2 z-20 p-2 rounded-xl shadow-lg backdrop-blur-sm
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

                    <div className="h-1" />
                  </div>
                )}
              </div>

              {produtos.length > 0 && (
                <div
                  className={`
                    flex-shrink-0 border-t px-3 py-2.5 sm:px-4 sm:py-3
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
                        className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wide ${
                          modoNoturno ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        Total da compra
                      </p>

                      <p className="text-xl sm:text-2xl font-black text-green-500">
                        R$ {formatarMoeda(calcularTotalCompra())}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModalExportarOpen(true)}
                        className="sm:hidden px-4 py-2.5 rounded-xl bg-gray-700 hover:bg-green-700 text-white text-xs font-black transition"
                      >
                        Exportar
                      </button>

                      <button
                        onClick={handleLimparLista}
                        className="sm:hidden px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {exibirModalConfirmacao && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div
              className={`
                w-full max-w-sm rounded-[2rem] border shadow-2xl p-7 text-center
                ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500 text-white flex items-center justify-center text-4xl mb-5 shadow-lg">
                ⚠️
              </div>

              <h3 className="text-2xl font-black">Apagar lista?</h3>

              <p
                className={`mt-2 text-sm ${
                  modoNoturno ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Esta ação não pode ser desfeita. Todos os itens serão removidos.
              </p>

              <div className="grid gap-3 mt-7">
                <button
                  onClick={confirmarLimpeza}
                  className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black transition-all active:scale-95"
                >
                  Sim, apagar
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

        {modalExportarOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div
              className={`
                w-full max-w-md rounded-[2rem] border shadow-2xl p-7
                ${modoNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}
              `}
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-green-600 text-white flex items-center justify-center text-4xl mb-5 shadow-lg">
                  📄
                </div>

                <h2 className="text-2xl font-black">Exportar relatório</h2>

                <p
                  className={`text-sm mt-2 ${
                    modoNoturno ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  Escolha o formato para salvar sua lista de compras.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    exportarExcel();
                    setModalExportarOpen(false);
                  }}
                  className="h-16 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition font-black"
                >
                  Excel
                </button>

                <button
                  onClick={() => {
                    exportarPDF();
                    setModalExportarOpen(false);
                  }}
                  className="h-16 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition font-black"
                >
                  PDF
                </button>
              </div>

              <button
                onClick={() => setModalExportarOpen(false)}
                className={`
                  w-full h-12 rounded-2xl font-black transition mt-4
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
        )}

        {isOpen && (
          <div
            className={`
              fixed inset-0 z-50 flex justify-center items-center p-3 sm:p-4 transition-all
              ${modoNoturno ? 'bg-gray-900/90 text-gray-100' : 'bg-black/70 text-gray-900'}
            `}
          >
            <div
              className={`
                w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[2rem] shadow-2xl border
                ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}
            >
              <div
                className={`
                  px-5 sm:px-6 py-5 border-b
                  ${modoNoturno ? 'border-gray-700' : 'border-gray-200'}
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black">
                      {editandoIndex !== null ? 'Editar produto' : 'Adicionar produto'}
                    </h1>

                    <p
                      className={`mt-1 text-sm ${
                        modoNoturno ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Preencha os dados do produto ou use o leitor de código.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fecharModal}
                    disabled={leitorAtivo}
                    className={`
                      w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black transition flex-shrink-0
                      ${
                        leitorAtivo
                          ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                          : modoNoturno
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
                {leitorAtivo && (
                  <div>
                    <div className="relative w-full h-52 bg-black rounded-2xl overflow-hidden">
                      <video
                        id="video-scanner-somar"
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

                <div>
                  <label
                    className={`block text-xs font-black uppercase tracking-wide mb-2 ${
                      modoNoturno ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    EAN do produto
                  </label>

                  <input
                    type="number"
                    placeholder="Digite ou leia o código EAN"
                    value={ean}
                    onChange={(e) => setEan(e.target.value)}
                    className={`
                      w-full h-12 px-4 rounded-2xl border outline-none font-semibold transition-all focus:ring-4
                      ${inputBase}
                    `}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => buscarProdutoPorEan(ean)}
                    className="h-12 font-black rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                  >
                    Buscar EAN
                  </button>

                  <button
                    onClick={() => setLeitorAtivo((prev) => !prev)}
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

                <div>
                  <label
                    className={`block text-xs font-black uppercase tracking-wide mb-2 ${
                      modoNoturno ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Produto
                  </label>

                  <input
                    type="text"
                    placeholder="Nome do produto"
                    value={nomeProduto}
                    onChange={(e) => setNomeProduto(e.target.value)}
                    className={`
                      w-full h-12 px-4 rounded-2xl border outline-none font-semibold transition-all focus:ring-4
                      ${inputBase}
                    `}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      placeholder="R$"
                      value={valorProduto}
                      onChange={(e) => setValorProduto(e.target.value)}
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
                      Quantidade
                    </label>

                    <input
                      type="number"
                      placeholder="Qtd."
                      value={quantidadeProduto}
                      onChange={(e) => setQuantidadeProduto(e.target.value)}
                      className={`
                        w-full h-12 px-4 rounded-2xl border outline-none font-semibold transition-all focus:ring-4
                        ${inputBase}
                      `}
                    />
                  </div>
                </div>

                {erro && (
                  <p className="text-red-500 font-black text-sm text-center">
                    {erro}
                  </p>
                )}
              </div>

              <div
                className={`
                  px-5 sm:px-6 py-5 border-t grid grid-cols-1 sm:grid-cols-2 gap-3
                  ${modoNoturno ? 'border-gray-700' : 'border-gray-200'}
                `}
              >
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={leitorAtivo}
                  className={`
                    h-12 rounded-2xl font-black transition-all active:scale-95
                    ${
                      leitorAtivo
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        : modoNoturno
                          ? 'bg-gray-900 hover:bg-gray-700 text-gray-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }
                  `}
                >
                  {leitorAtivo ? 'Leitor ativo...' : 'Cancelar'}
                </button>

                <button
                  onClick={handleAddProduto}
                  className="
                    h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white
                    font-black transition-all active:scale-95 shadow-lg shadow-blue-600/20
                  "
                >
                  {editandoIndex !== null ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SomarValor;