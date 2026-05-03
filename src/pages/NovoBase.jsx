import { useState, useEffect, useRef } from "react";
import { useTheme } from '../components/ThemeContext'; 
import { BrowserMultiFormatReader } from "@zxing/library";
import SidebarMenu from '../components/SidebarMenu'; 
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COL_NOME = "w-2/5";
const COL_VALOR = "w-1/5";
const COL_QTD = "w-1/5";
const COL_TOTAL = "w-1/5";

/**
  * Tela principal do sistema após o login.
 * 🔑 AJUSTE: usuarioLogado agora é um OBJETO: { role: 'admin'/'usuario', email: '...', name: '...' }
 * @param {object} usuarioLogado - Objeto com informações do usuário logado, passado pelo App.jsx.
 * @param {function(string, string): void} onSelectOption - Função para navegar para a tela de funcionalidade (App.jsx).
 * @param {function(): void} onLogoutSuccess - A função de logout REAL, passada pelo App.jsx.
 */
const ValorDefinido =  ({items , onGoHome,  usuarioLogado, onLogoutSuccess, onToggleModoNoturno }) => {

const isAdmin = usuarioLogado?.role === 'admin';
const userEmail = usuarioLogado?.email || 'usuario@sistema.com';
const userName = usuarioLogado?.name || (isAdmin ? "Admin" : "Usuário Comum");

//modal de export impressão
const [modalExportarOpen, setModalExportarOpen] = useState(false);

const [exibirModalConfirmacao, setExibirModalConfirmacao] = useState(false);

const { modoNoturno, toggleModoNoturno } = useTheme(); // Pega o tema do Contexto

const [ean, setEan] = useState("");
const [nomeProduto, setNomeProduto] = useState("");
const [valorProduto, setValorProduto] = useState("");
const [quantidadeProduto, setQuantidadeProduto] = useState("");
const [erro, setErro] = useState("");
const [editandoIndex, setEditandoIndex] = useState(null);
const [produtos, setProdutos] = useState(items || []);
const [isOpen, setIsOpen] = useState(false);
const [produtoSelecionadoIndex, setProdutoSelecionadoIndex] = useState(null);

const [currentPage, setCurrentPage] = useState('somar');
const [isMenuOpen, setIsMenuOpen] = useState(false);

// Estados do Scanner
const [leitorAtivo, setLeitorAtivo] = useState(false);
const codeReaderRef = useRef(null);

const closeMenu = () => setIsMenuOpen(false);
const toggleMenu = () => setIsMenuOpen(prev => !prev);

const handleLimparLista = () => {
    if (produtos.length === 0) return;
    setExibirModalConfirmacao(true); // Abre o modal
};

const confirmarLimpeza = () => {
    setProdutos([]);
    setProdutoSelecionadoIndex(null);
    localStorage.removeItem("produtos");
    setExibirModalConfirmacao(false); // Fecha o modal
};
    
    // --- Funções de Logout ---
 const handleLogout = () => {
  console.log("Saindo do sistema...");
  if (onLogoutSuccess) {
    onLogoutSuccess(); 
  } else {
    alert("Sessão encerrada. (Faltando a função onLogoutSuccess do componente pai)");
  }
 };
    
    const handleNavigation = (pageId) => {
  closeMenu();
  
  if (pageId === 'home') {
    onGoHome();
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
      alert("Acesso negado: Você não tem permissão de administrador.");
      return;
    }
  }

  setCurrentPage(pageId); 
};

    
    // Estrutura de Opções base
    const baseMenuOptions = [
  { id: 'home', icon: '🏠', type: 'link', description: 'Voltar para a seleção de modo' },
  { id: 'gestor', icon: '📦', type: 'link', description: 'Gerenciar códigos de barras' },
  { id: 'themeToggle', icon: '🌙', type: 'toggleTheme', description: `Tema: ${modoNoturno ? 'Escuro' : 'Claro'}` },
];

    // FILTRAGEM DO MENU: Aplica a restrição de ADMIN
    const globalMenuOptions = baseMenuOptions.filter(item => {
        if (item.id === 'gestor' && !isAdmin) {
            return false;
        }
        return true;
    });

    // Informações da Conta (Para o rodapé do SidebarMenu)
    const userAccountInfo = {
        username: userName, 
        email: userEmail, 
        onLogout: handleLogout, 
        isAdmin: isAdmin, 
    };

    useEffect(() => {
        if (items && items.length > 0) {
            setProdutos(items);
        } else {
            const produtosSalvos = localStorage.getItem("produtos");
            if (produtosSalvos) {
                setProdutos(JSON.parse(produtosSalvos));
            }
        }
    }, [items]);
    useEffect(() => {
        localStorage.setItem("produtos", JSON.stringify(produtos));
    }, [produtos]);
        
    const buscarProdutoPorEan = async (codigoEan) => {
        if (!codigoEan) {
            setErro("Informe um código EAN válido.");
            setTimeout(() => setErro(""), 1500);
            return;
        }
        
        try {
            // 🔹 1️⃣ Tenta buscar no EANData
            const apiKey = "4210726968ED3C18";
            const urlEanData = `https://eandata.com/feed/?v=3&keycode=${apiKey}&mode=json&find=${codigoEan}`;
            const responseEan = await fetch(urlEanData);
            const dataEan = await responseEan.json();

            // Valida se a resposta tem produto real
            const produtoValido =
                dataEan &&
                dataEan.product &&
                (dataEan.product.title || dataEan.product.attributes?.product);

            if (produtoValido) {
                const nome =
                    dataEan.product.attributes?.product ||
                    dataEan.product.title ||
                    "Produto não identificado";

                const preco =
                    dataEan.product.attributes?.price ||
                    dataEan.product.attributes?.msrp ||
                    "";

                setNomeProduto(nome);
                setValorProduto(preco ? preco.toString() : "0");
                setErro("");
                return; // ✅ Encontrado no EANData
            }

            // 🔹 2️⃣ Caso não tenha encontrado no EANData, tenta no MockAPI
            const mockApiUrl = "https://68ed848edf2025af780067e3.mockapi.io/gestor/produtos";
            const responseMock = await fetch(`${mockApiUrl}?ean=${codigoEan}`);
            const dataMock = await responseMock.json();

            if (Array.isArray(dataMock) && dataMock.length > 0) {
                const produtoMock = dataMock[0];
                setNomeProduto(produtoMock.nome);
                setValorProduto(produtoMock.valor ? produtoMock.valor.toString() : "0");
                setErro("");
                return; // ✅ Encontrado no MockAPI
            }

            // 🔹 3️⃣ Nenhum produto encontrado nas duas fontes
            setErro("Produto não encontrado.");
            setNomeProduto("");
            setValorProduto("");
            setTimeout(() => setErro(""), 2000);

        } catch (err) {
            console.error("Erro ao consultar produto:", err);
            setErro("Erro ao consultar o produto. Tente novamente.");
            setTimeout(() => setErro(""), 2000);
        }
    };

    //  SCANNER EAN
    useEffect(() => {
        if (!leitorAtivo) {
            if (codeReaderRef.current) codeReaderRef.current.reset();
            return;
        }
        
        const initScanner = async () => {
            try {
                const codeReader = new BrowserMultiFormatReader();
                codeReaderRef.current = codeReader;

                // Lista todas as câmeras
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(d => d.kind === "videoinput");

                console.log("Câmeras detectadas:", videoDevices.map(d => d.label));

                // 🔍 tenta achar câmeras traseiras
                const backCameras = videoDevices.filter(d =>
                    /back|rear|environment|traseira/i.test(d.label)
                );

                // 🎯 Se houver mais de uma, tenta a segunda (geralmente a traseira principal)
                let mainCamera;
                if (backCameras.length >= 2) {
                    mainCamera = backCameras[1];
                } else if (backCameras.length === 1) {
                    mainCamera = backCameras[0];
                } else {
                    // fallback para a primeira câmera se disponível
                    mainCamera = videoDevices.length > 0 ? videoDevices[0] : videoDevices[1];
                }

                if (!mainCamera) throw new Error("Nenhuma câmera disponível.");

                const constraints = {
                    video: {
                        deviceId: { exact: mainCamera.deviceId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        advanced: [{ focusMode: "continuous" }]
                    }
                };

                await codeReader.decodeFromConstraints(constraints, "video", (result, err) => {
                    if (result) {
                        const codigo = result.getText();
                        setEan(codigo);
                        buscarProdutoPorEan(codigo);
                        codeReader.reset();
                        setLeitorAtivo(false);
                    }
                });

            } catch (err) {
                console.error("Erro ao acessar a câmera:", err);
                setErro("Erro ao acessar a câmera. Verifique as permissões ou tente outra câmera.");
            }
        };

        initScanner();

        return () => {
            if (codeReaderRef.current) codeReaderRef.current.reset();
        };
    }, [leitorAtivo]);

    const handleAddProduto = () => { 
        if (!nomeProduto || !valorProduto || !quantidadeProduto) {
            setErro('Por favor, preencha todos os campos.');
            setTimeout(() => setErro(""), 1500);
            return;
        }

        const novoProduto = {
            ean: ean || null,
            nome: nomeProduto,
            valor: parseFloat(valorProduto),
            quantidade: parseInt(quantidadeProduto),
            total: parseFloat(valorProduto) * parseInt(quantidadeProduto),
        };

        if (editandoIndex !== null) {
            const produtosAtualizados = produtos.map((produto, index) =>
                index === editandoIndex ? novoProduto : produto
            );
            setProdutos(produtosAtualizados);
            setEditandoIndex(null);
        } else {
            setProdutos([...produtos, novoProduto]);
        }

        setEan('');
        setNomeProduto('');
        setValorProduto('');
        setQuantidadeProduto('');
        setErro('');
        setIsOpen(false);
        setProdutoSelecionadoIndex(null);
        setLeitorAtivo(false);
    };

    const handleEditProduto = (index) => {
        const produto = produtos[index];
        setEan(produto.ean || "");
        setNomeProduto(produto.nome);
        setValorProduto(produto.valor.toString());
        setQuantidadeProduto(produto.quantidade.toString());
        setEditandoIndex(index);
        setIsOpen(true);
        setProdutoSelecionadoIndex(null);
    };

    const handleDeleteProduto = (index) => {
        setProdutos(produtos.filter((_, i) => i !== index));
        setProdutoSelecionadoIndex(null);
    };

    const calcularTotalCompra = () => produtos.reduce((acc, produto) => acc + produto.total, 0);

    const handleRowClick = (index) => {
        setProdutoSelecionadoIndex(index === produtoSelecionadoIndex ? null : index);
    };

    // SUBSTITUA SUA FUNÇÃO gerarPDF() POR ESTAS DUAS FUNÇÕES

const exportarExcel = () => {
    if (produtos.length === 0) {
        setErro("Não há produtos para exportar.");
        setTimeout(() => setErro(""), 2000);
        return;
    }

    const dados = produtos.map((produto) => ({
        EAN: produto.ean || "-",
        Produto: produto.nome,
        "Valor Unitário": produto.valor,
        Quantidade: produto.quantidade,
        Total: produto.total
    }));

    // adiciona total geral no final
    dados.push({
        EAN: "",
        Produto: "TOTAL GERAL",
        "Valor Unitário": "",
        Quantidade: "",
        Total: calcularTotalCompra()
    });

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Lista de Compras"
    );

    const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array"
    });

    const data = new Blob(
        [excelBuffer],
        {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
    );

    saveAs(data, "lista-compras.xlsx");
};


const exportarPDF = () => {
    if (produtos.length === 0) {
        setErro("Não há produtos para exportar.");
        setTimeout(() => setErro(""), 2000);
        return;
    }

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Relatório de Gestão de Compras", 14, 15);

    const tableRows = produtos.map((produto) => [
        produto.ean || "-",
        produto.nome,
        `R$ ${produto.valor.toFixed(2)}`,
        produto.quantidade,
        `R$ ${produto.total.toFixed(2)}`
    ]);

    autoTable(doc, {
        head: [["EAN", "Produto", "Valor Unit.", "Qtd", "Total"]],
        body: tableRows,
        startY: 25,
    });

    const finalY = doc.lastAutoTable?.finalY || 30;

    doc.text(
        `TOTAL GERAL: R$ ${calcularTotalCompra().toFixed(2)}`,
        14,
        finalY + 10
    );

    doc.save("lista-produtos.pdf");
};

    // -------------------------------------------------------------
    // RENDERIZAÇÃO
    // -------------------------------------------------------------
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
                menuItems={globalMenuOptions}
                accountInfo={userAccountInfo}
                activeLink="lista"
                onNavigate={handleNavigation}
                isMenuOpen={isMenuOpen}
                onClose={closeMenu}
            />

            <main className="flex-grow flex flex-col h-full p-4 sm:p-8 overflow-hidden relative">
                {/* Header Mobile - Idêntico à TelaInicial */}
                <header className="md:hidden flex-shrink-0 flex items-center justify-between p-4 fixed top-0 left-0 w-full z-20">
                    <button 
                        onClick={toggleMenu} 
                        className={`p-2 rounded-lg text-2xl ${modoNoturno ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
                    > ☰ </button>
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-extrabold">Lista de Compra 🛒</h1>
                        <p className="opacity-60 text-xs font-bold uppercase tracking-widest">Somar valor</p>
                        </div>
                    <div className="w-8"></div>
                </header>

                {/* Conteúdo da tela SomarValor - ENGLOBA TODOS OS ELEMENTOS DA TELA PRINCIPAL */}
                <div className="container mx-auto max-w-4xl pt-12 md:pt-0 flex-grow">
                    <h1 className="py-4 p-8 text-center text-4xl font-extrabold hidden md:block">Sua Lista de Compras 🛒</h1>

            
                    
    
                </div>
            </main>
        </div>
    );
};

export default ValorDefinido;