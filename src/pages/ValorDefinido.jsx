import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import SidebarMenu from '../components/SidebarMenu';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Definições de Largura OTIMIZADAS (para manter a consistência visual)
const COL_NOME = "w-2/5"; // 40%
const COL_VALOR = "w-1/5"; // 20%
const COL_QTD = "w-1/5"; // 20%
const COL_TOTAL = "w-1/5"; // 20%

// O componente agora recebe modoNoturno e onToggleModoNoturno via props
const ValorDefinido = ({
  onGoHome,
  modoNoturno,
  onToggleModoNoturno,
  items = [],
  setItems
}) => {

    // 1. Inicializa o valor pré-definido lendo do localStorage
    const getInitialValorPreDefinido = () => {
        return localStorage.getItem("valorPreDefinido") || '';
    };

    const initialValorPreDefinido = getInitialValorPreDefinido();

    // ESTADOS
    const [produtos, setProdutos] = useState([]);
    const [nomeProduto, setNomeProduto] = useState('');
    const [valorProduto, setValorProduto] = useState('');
    const [quantidadeProduto, setQuantidadeProduto] = useState('');
    const [valorPreDefinido, setValorPreDefinido] = useState(initialValorPreDefinido);
    const [erro, setErro] = useState('');
    const [editandoIndex, setEditandoIndex] = useState(null);
    const [produtoSelecionadoIndex, setProdutoSelecionadoIndex] = useState(null);

    const closeMenu = () => setIsMenuOpen(false);
    const toggleMenu = () => setIsMenuOpen(prev => !prev);

    //EXPORTANDO EM EXCEL/PDF
    const [modalExportarOpen, setModalExportarOpen] = useState(false);

    //LIMPEZA DA LISTA
    const [exibirModalConfirmacao, setExibirModalConfirmacao] = useState(false);
    
    // NOVO ESTADO para controlar o aviso de estouro de orçamento SEM BLOQUEAR a ação
    const [avisoEstouro, setAvisoEstouro] = useState(''); 

    // isBudgetEditing inicializa como TRUE se valorPreDefinido for vazio
    const [isBudgetEditing, setIsBudgetEditing] = useState(initialValorPreDefinido === '');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ESTADOS E REFS PARA O SCANNER/EAN
    const [ean, setEan] = useState("");
    const [leitorAtivo, setLeitorAtivo] = useState(false);
    const codeReaderRef = useRef(null);
    // Embora decodeFromConstraints use o ID, manter o ref é bom para práticas de React
    const videoRef = useRef(null); 

    //LIMPAR LISTA LÓGICA
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


    //EXPORTAR EM EXCEL
    const exportarExcel = () => {
    if (produtos.length === 0) {
        setErro("Não há produtos para exportar.");
        setTimeout(() => setErro(""), 3000);
        return;
    }

    const dados = produtos.map((produto) => ({
        Produto: produto.nome,
        "Valor Unitário": produto.valor,
        Quantidade: produto.quantidade,
        Total: produto.total,
        EAN: produto.ean || "-"
    }));

    // Adiciona resumo final
    dados.push({
        Produto: "TOTAL GERAL",
        "Valor Unitário": "",
        Quantidade: "",
        Total: calcularTotalCompra(),
        EAN: ""
    });

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");

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

    saveAs(data, "relatorio_compras.xlsx");
};

    //EXPORTAR EM PDF
    const exportarPDF = () => {
    if (produtos.length === 0) {
        setErro("Não há produtos para exportar.");
        setTimeout(() => setErro(""), 3000);
        return;
    }

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Relatório de Compras", 14, 15);

    const tableData = produtos.map((produto) => [
        produto.nome,
        `R$ ${produto.valor.toFixed(2)}`,
        produto.quantidade,
        `R$ ${produto.total.toFixed(2)}`,
        produto.ean || "-"
    ]);

    autoTable(doc, {
        head: [["Produto", "Valor Unit.", "Qtd", "Total", "EAN"]],
        body: tableData,
        startY: 25,
    });

    const finalY = doc.lastAutoTable.finalY || 30;

    doc.text(
        `TOTAL GERAL: R$ ${calcularTotalCompra().toFixed(2)}`,
        14,
        finalY + 10
    );

    doc.save("relatorio_compras.pdf");
};


    // EFEITOS (Carregar/Salvar)
    useEffect(() => {
        if (items.length > 0) {
            const produtosConvertidos = items.map((item) => ({
                nome: item.nome,
                quantidade: item.quantidade || 1,
                valor: item.valor || 0,
                total: (item.quantidade || 1) * (item.valor || 0),
                ean: item.ean || null,
            }));

            setProdutos(produtosConvertidos);
        }
    }, [items]);

    useEffect(() => {
        localStorage.setItem("produtosDefinido", JSON.stringify(produtos));
        // A CADA ATUALIZAÇÃO DE PRODUTOS, VERIFICA SE ESTOUROU O ORÇAMENTO
        const valorMaximo = parseFloat(valorPreDefinido.replace(',', '.')) || 0;
        const totalGeral = calcularTotalCompra(produtos); // Passa 'produtos' atualizado
        
        if (totalGeral > valorMaximo && valorMaximo > 0) {
            setAvisoEstouro(`⚠️ O valor total R$ ${totalGeral.toFixed(2)} EXCEDEU o orçamento de R$ ${valorMaximo.toFixed(2)}.`);
        } else {
            setAvisoEstouro('');
        }

    }, [produtos, valorPreDefinido]); // Depende de produtos E valorPreDefinido
    
    // Função auxiliar para calcular o total (agora pode receber o array como parâmetro)
    const calcularTotalCompra = (prods = produtos) => prods.reduce((acc, produto) => acc + produto.total, 0);


    useEffect(() => {
        localStorage.setItem("valorPreDefinido", valorPreDefinido);
    }, [valorPreDefinido]);


    // --------------------------------------------------------
    // FUNÇÕES DO SCANNER/EAN 
    // --------------------------------------------------------

    const handleScanClick = () => {
        if (leitorAtivo) {
            // Desativar
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
            }
            setLeitorAtivo(false);
        } else {
            // Ativar
            setEan('');
            setErro('');
            setLeitorAtivo(true);
        }
    };

    const handleSearchEan = async (codigoEanExterno) => {
        const codigoEan = codigoEanExterno || ean;

        if (!codigoEan) {
            setErro("Informe um código EAN válido.");
            setTimeout(() => setErro(""), 1500);
            return;
        }

        // Limpa campos para evitar confusão de dados antigos
        setNomeProduto("");
        setValorProduto("");
        setErro("");

        try {
            // 🔹 1️⃣ Tenta buscar no EANData
            const apiKey = "4210726968ED3C18"; // Chave de API fixa
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

                setEan(codigoEan); // Garante que o EAN esteja no estado
                setNomeProduto(nome);
                setValorProduto(preco ? preco.toString() : "0");
                
                setTimeout(() => setErro(""), 2000);
                return; // ✅ Encontrado no EANData
            }

            // 🔹 2️⃣ Caso não tenha encontrado no EANData, tenta no MockAPI
            const mockApiUrl = "https://68ed848edf2025af780067e3.mockapi.io/gestor/produtos";
            const responseMock = await fetch(`${mockApiUrl}?ean=${codigoEan}`);
            const dataMock = await responseMock.json();

            if (Array.isArray(dataMock) && dataMock.length > 0) {
                const produtoMock = dataMock[0];
                setEan(codigoEan); // Garante que o EAN esteja no estado
                setNomeProduto(produtoMock.nome);
                setValorProduto(produtoMock.valor ? produtoMock.valor.toString() : "0");
                
                setTimeout(() => setErro(""), 2000);
                return; // ✅ Encontrado no MockAPI
            }

            // 🔹 3️⃣ Nenhum produto encontrado nas duas fontes
            setErro("Produto não encontrado. Preencha manualmente.");
            setNomeProduto("");
            setValorProduto("");
            setTimeout(() => setErro(""), 3000);

        } catch (err) {
            console.error("Erro ao consultar produto:", err);
            setErro("Erro ao consultar o produto. Tente novamente.");
            setTimeout(() => setErro(""), 3000);
        }
    };


    // EFEITO: Lógica do Scanner (COM SELEÇÃO INTELIGENTE DA CÂMERA TRASEIRA)
    useEffect(() => {
        // 1. Limpeza/Desativação
        if (!leitorAtivo) {
            if (codeReaderRef.current) codeReaderRef.current.reset();
            return;
        }

        const initScanner = async () => {
            try {
                // Inicializa o leitor apenas se não estiver inicializado
                if (!codeReaderRef.current) {
                    codeReaderRef.current = new BrowserMultiFormatReader();
                }
                const codeReader = codeReaderRef.current;

                // 2. Seleção da Câmera Traseira
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(d => d.kind === "videoinput");

                console.log("Câmeras detectadas:", videoDevices.map(d => d.label));

                // 🔍 tenta achar câmeras traseiras
                const backCameras = videoDevices.filter(d =>
                    /back|rear|environment|traseira/i.test(d.label)
                );

                // 🎯 Lógica de seleção (prioriza traseira, tenta a segunda se houver mais de uma)
                let mainCamera;
                if (backCameras.length >= 2) {
                    mainCamera = backCameras[1];
                } else if (backCameras.length === 1) {
                    mainCamera = backCameras[0];
                } else {
                    // fallback para a primeira câmera disponível
                    mainCamera = videoDevices.length > 0 ? videoDevices[0] : null;
                }
                
                // Fallback final: tenta a segunda câmera se a primeira não funcionar
                if (!mainCamera && videoDevices.length > 1) {
                    mainCamera = videoDevices[1];
                }

                if (!mainCamera) throw new Error("Nenhuma câmera disponível.");

                // 3. Definição das Restrições (Constraints)
                const constraints = {
                    video: {
                        deviceId: { exact: mainCamera.deviceId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        advanced: [{ focusMode: "continuous" }]
                    }
                };

                // 4. Início da Leitura com Constraints
                // O ID "video-scanner" DEVE CORRESPONDER ao ID no elemento <video> no JSX
                await codeReader.decodeFromConstraints(constraints, "video-scanner", (result, err) => {
                    if (result) {
                        const capturedEan = result.getText();
                        setEan(capturedEan);
                        
                        // Chama a função de busca
                        handleSearchEan(capturedEan); 
                        
                        // Desativa o leitor após a leitura
                        handleScanClick(); 
                    }
                    
                    if (err && !(err instanceof NotFoundException)) {
                        console.error("Erro durante a leitura:", err);
                        // setErro(`Erro de leitura: ${err.message}`); // Opcional: mostrar erro
                    }
                });

            } catch (err) {
                console.error("Erro ao acessar a câmera:", err);
                setErro("Erro ao acessar a câmera. Verifique as permissões ou tente outra câmera.");
                setTimeout(() => setErro(""), 3000); 
                setLeitorAtivo(false); // Desativa para evitar loops
            }
        };

        initScanner();

        // 5. Função de Limpeza
        return () => {
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
            }
        };
    // Dependências: Garante que o efeito re-execute quando 'leitorAtivo' mudar
    }, [leitorAtivo]); 
    
    // --------------------------------------------------------
    // FIM DAS FUNÇÕES DO SCANNER/EAN
    // --------------------------------------------------------


    // HANDLERS
    const handleSetBudget = (novoValor) => {
        const valorNumerico = parseFloat(novoValor.replace(',', '.'));

        if (!isNaN(valorNumerico) && valorNumerico >= 0) {
            setValorPreDefinido(novoValor);
            setIsBudgetEditing(false);
            // Recalcula o aviso de estouro ao definir um novo orçamento
            const totalGeral = calcularTotalCompra();
            if (totalGeral > valorNumerico && valorNumerico > 0) {
                 setAvisoEstouro(`⚠️ O valor total R$ ${totalGeral.toFixed(2)} EXCEDEU o orçamento de R$ ${valorNumerico.toFixed(2)}.`);
            } else {
                 setAvisoEstouro('');
            }

        } else {
            setErro('Por favor, insira um valor numérico positivo.');
            setTimeout(() => setErro(''), 3000);
        }
    };

    // A função calcularTotalCompra já foi atualizada acima para aceitar um argumento
    // const calcularTotalCompra = () => produtos.reduce((acc, produto) => acc + produto.total, 0);

    const calcularRestante = () => {
        const valorMaximo = parseFloat(valorPreDefinido.replace(',', '.')) || 0;
        return valorMaximo - calcularTotalCompra();
    };

    const handleOpenModal = (index = null) => {
        // --- BLOQUEIO DE ADIÇÃO SEM ORÇAMENTO ---
        if (index === null && !valorPreDefinido) {
            setErro('Por favor, defina o "Orçamento Máximo" antes de adicionar um produto.');
            setTimeout(() => setErro(''), 5000);
            return; // Bloqueia a abertura do modal
        }
        // --- FIM DO BLOQUEIO ---

        if (index !== null) {
            const produto = produtos[index];
            setEan(produto.ean || ""); // Carrega EAN para edição
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

        // DESATIVA SCANNER AO ABRIR MODAL se estiver ativo
        if (leitorAtivo) {
            handleScanClick();
        }

        setErro('');
        setIsModalOpen(true);
    };

    // FUNÇÃO CORRIGIDA/ATUALIZADA: Desativa o scanner e limpa estados ao fechar
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setNomeProduto('');
        setValorProduto('');
        setQuantidadeProduto('');
        setEditandoIndex(null);
        setEan(''); // Limpar EAN
        
        // Desliga o scanner se estiver ativo
        if (leitorAtivo) { 
            handleScanClick(); 
        }

        setErro(''); // Limpa o erro também ao fechar
    };

    const handleAddProduto = () => {
        // PRIMEIRA VALIDAÇÃO: Checa se algum campo está vazio
        if (!nomeProduto || !valorProduto || !quantidadeProduto) {
            setErro('Por favor, preencha todos os campos.');
            setTimeout(() => setErro(''), 3000);
            return;
        }

        const novoValor = parseFloat(valorProduto.replace(',', '.'));
        const novaQtd = parseInt(quantidadeProduto);

        // SEGUNDA VALIDAÇÃO: Checa se os valores são numéricos e maiores que zero
        if (isNaN(novoValor) || isNaN(novaQtd) || novoValor <= 0 || novaQtd <= 0) {
            setErro('Valores e quantidade devem ser números positivos válidos (maiores que zero).');
            setTimeout(() => setErro(''), 3000);
            return;
        }

        const novoProduto = {
            ean: ean || null, // Incluindo EAN
            nome: nomeProduto,
            valor: novoValor,
            quantidade: novaQtd,
            total: novoValor * novaQtd,
        };

        // TERCEIRA VALIDAÇÃO: Orçamento (AGORA APENAS AVISA, NÃO BLOQUEIA)
        const totalAtualSemEste = editandoIndex !== null 
            ? calcularTotalCompra() - produtos[editandoIndex].total 
            : calcularTotalCompra();

        const novoTotalGeral = totalAtualSemEste + novoProduto.total;
        const valorMaximo = parseFloat(valorPreDefinido.replace(',', '.')) || 0;

        // 🛑 MUDANÇA AQUI: Removemos o 'return' e a lógica de erro do formulário.
        // A lógica de aviso de estouro está no useEffect, que é executado após o setProdutos.
        // No entanto, podemos definir o avisoEstouro (que é usado no corpo principal) aqui para ser mais imediato.

        if (editandoIndex !== null) {
            const produtosAtualizados = produtos.map((produto, index) =>
                index === editandoIndex ? novoProduto : produto
            );
            setProdutos(produtosAtualizados);
        } else {
            setProdutos([...produtos, novoProduto]);
        }
        
        // Define o erro/aviso temporário (opcional, o useEffect fará a validação final)
        if (valorMaximo > 0 && novoTotalGeral > valorMaximo) {
            // Apenas para mostrar um aviso rápido no modal antes de fechar
             setErro(`ATENÇÃO: Este produto fará o orçamento exceder em R$ ${(novoTotalGeral - valorMaximo).toFixed(2).replace('.', ',')}!`);
             setTimeout(() => setErro(''), 5000); // Limpa o aviso após um tempo

        }

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


    // Estilos dinâmicos do progresso
    const valorMaximo = parseFloat(valorPreDefinido.replace(',', '.')) || 1; // Evita divisão por zero
    const totalGasto = calcularTotalCompra();
    const percentual = Math.min((totalGasto / valorMaximo) * 100, 100);
    // CORRIGIDO: Use uma cor mais forte se o totalGasto for MAIOR que o valorMaximo (estouro)
    const corProgresso = totalGasto > valorMaximo ? 'bg-red-700' : percentual >= 90 ? 'bg-red-500' : percentual >= 70 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div className={`min-h-screen p-6 relative flex flex-col ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
            
           <header className="md:hidden flex-shrink-0 flex items-center justify-between mb-4">
					<button 
						onClick={toggleMenu} 
						className={`p-2 rounded-lg text-2xl ${modoNoturno ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
					> ☰ </button>
					<div>
						<h1 className="text-2xl sm:text-4xl font-extrabold">Gerenciar Orçamento 🛒</h1>
						<p className="opacity-60 text-xs font-bold uppercase tracking-widest">Controle de gastos</p>
                    </div>
					<div className="w-"></div>
				</header>

            <div className="container mx-auto max-w-4xl flex-grow">
                {/* Bloco de Aviso de Estouro - Visível no corpo principal */}
                {avisoEstouro && (
                    <div className="p-3 mb-4 text-center rounded-lg bg-red-100 border border-red-400 text-red-800 dark:bg-red-900/50 dark:border-red-600 dark:text-red-400 font-semibold shadow-md">
                        {avisoEstouro}
                    </div>
                )}                
                
                {/* ----------------------------------------------------------------- */}
                {/* ORÇAMENTO MÁXIMO (Budget Block) */}
                {/* ----------------------------------------------------------------- */}
                <div className={`p-4 mb-6 rounded-xl shadow-xl ${modoNoturno ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                        <h2 className="text-lg font-bold mb-2">Orçamento Máximo Definido</h2>
                        <button 
                            onClick={() => setIsBudgetEditing(true)} 
                            className={`p-2 rounded-full transition ${modoNoturno ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                            title="Editar Orçamento">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    
                    {isBudgetEditing ? (
                        <div className="flex w-full gap-2 mt-2">
                            <input
                                type="number"
                                step="0.01"
                                placeholder="R$ 0.00"
                                value={valorPreDefinido}
                                onChange={(e) => setValorPreDefinido(e.target.value)}
                                className={`flex-grow w-2/3 border rounded-lg p-2 focus:ring-2 focus:outline-none ${modoNoturno ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-400' : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'}`}
                            />
                            <button onClick={() => handleSetBudget(valorPreDefinido)} className="bg-green-500 w-1/3 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold">
                                Salvar
                            </button>
                        </div>
                    ) : (
                        <p className="text-xl font-extrabold text-blue-500 mt-1">
                            R$ {parseFloat(valorPreDefinido).toFixed(2).replace('.', ',')}
                        </p>
                    )}

                    {/* Barra de Progresso e Totais */}
                    {!isBudgetEditing && valorPreDefinido && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold mb-2">Resumo da Compra</h3>
                            <div className="flex justify-between font-medium text-lg">
                                <span>Gasto Atual:</span>
                                <span className="text-green-500">R$ {calcularTotalCompra().toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg mt-1">
                                <span>Restante:</span>
                                {/* Destaque se o restante for negativo */}
                                <span className={calcularRestante() < 0 ? 'text-red-500' : 'text-blue-500'}>
                                    R$ {calcularRestante().toFixed(2).replace('.', ',')}
                                </span>
                            </div>
                            
                            {/* Barra de Progresso */}
                            <div className="w-full bg-gray-200 rounded-full h-3 mt-3 dark:bg-gray-700">
                                <div className={`${corProgresso} h-3 rounded-full transition-all duration-500`} style={{ width: `${Math.min(percentual, 100)}%` }}></div>
                            </div>
                            <p className="text-sm text-right mt-1 text-gray-500 dark:text-gray-400">
                                {totalGasto > valorMaximo ? `ESTOUROU! ${((totalGasto/valorMaximo) * 100).toFixed(1)}% do orçamento.` : `${percentual.toFixed(1)}% do orçamento gasto.`}
                            </p>
                        </div>
                    )}
                </div>

                {/* ----------------------------------------------------------------- */}
                {/* LISTA DE PRODUTOS */}
                {/* ----------------------------------------------------------------- */}
                <div className={`p-4 mt-4 rounded-xl shadow-lg border ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="overflow-y-scroll max-h-96">
                        {produtos.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="font-semibold text-lg mb-2">Sua lista de compras está vazia. 📝</p>
                                <p>Defina o orçamento e clique em <b>'+ Adicionar Produto'</b> para começar!</p>
                            </div>
                        ) : (
                            <div>
                                {/* Desktop Header */}
                                <div className="hidden sm:flex w-full border-b border-gray-300 dark:border-gray-600 font-bold text-sm text-gray-500 dark:text-gray-400">
                                    <div className={`px-4 py-2 ${COL_NOME}`}>Produto</div>
                                    <div className={`px-4 py-2 text-right ${COL_VALOR}`}>Valor Und.</div>
                                    <div className={`px-4 py-2 text-center ${COL_QTD}`}>Qtd.</div>
                                    <div className={`px-4 py-2 text-right ${COL_TOTAL}`}>Total</div>
                                </div>
                                {produtos.map((produto, index) => (
                                    <div key={index} onClick={() => handleRowClick(index)}
                                        className={`flex flex-col sm:flex-row border-b dark:border-gray-700 transition duration-100 cursor-pointer w-full relative
                                        ${index === produtoSelecionadoIndex ? 'bg-blue-100/50 dark:bg-blue-900/70' : (index % 2 === 0 ? ' ' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50')}`}>
                                        
                                        {/* Mobile layout */}
                                        <div className={`p-4 sm:hidden w-full`}>
                                            <div className="font-extrabold text-lg mb-2">{produto.nome}</div>
                                            <div className="grid grid-cols-3 gap-y-1 gap-x-4 text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-400">Valor Und.:</span>
                                                    <span className="font-medium">R$ {produto.valor.toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                <div className="flex flex-col text-center">
                                                    <span className="font-semibold text-gray-400">Qtd.:</span>
                                                    <span className="font-medium">{produto.quantidade}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-semibold text-gray-400">Total Item:</span>
                                                    <span className="text-lg font-bold text-green-500">R$ {produto.total.toFixed(2).replace('.', ',')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Desktop layout */}
                                        <div className="hidden sm:flex w-full">
                                            <div className={`px-4 py-3 text-left flex items-center ${COL_NOME}`}>{produto.nome}</div>
                                            <div className={`px-4 py-3 text-right flex items-center justify-end ${COL_VALOR}`}>R$ {produto.valor.toFixed(2).replace('.', ',')}</div>
                                            <div className={`px-4 py-3 text-center flex items-center justify-center ${COL_QTD}`}>{produto.quantidade}</div>
                                            <div className={`px-4 py-3 font-semibold text-right flex items-center justify-end ${COL_TOTAL} text-lg text-green-600 dark:text-green-400`}>R$ {produto.total.toFixed(2).replace('.', ',')}</div>
                                        </div>

                                        {/* Ações (Editar/Excluir) */}
                                        {index === produtoSelecionadoIndex && (
                                            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex gap-2 z-20 p-4 rounded-lg bg-white/70 backdrop-blur-sm dark:bg-gray-900/70 shadow-md">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleEditProduto(index); }} 
                                                    className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition" title="Editar">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteProduto(index); }}className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition" title="Excluir">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {produtos.length > 0 && (
                        <div className="flex justify-between items-center border-t-4 border-green-500 font-bold p-4 mt-2">
                            <span className="text-2xl text-green-600 dark:text-green-400">
                                Total: R$ {calcularTotalCompra().toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                    )}
                </div>

                {/* BOTÕES DE CONTROLE - DENTRO DO CONTAINER PRINCIPAL */}
					<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-2 mt-4 w-full">
                        <button
                            onClick={() => handleOpenModal()}
                            className={`w-full h-12 rounded-lg text-white font-semibold flex items-center justify-center ${
                                !valorPreDefinido
                                    ? 'bg-blue-400 opacity-50 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 transition'
                            }`}
                            disabled={!valorPreDefinido}
                        >
                            + Adicionar Produto
                        </button>

                        {produtos.length > 0 && (
                            <>
                                <button
                                    onClick={handleLimparLista}
                                    className="w-full h-12 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center"
                                >
                                    Limpar Lista
                                </button>
                                <button
                                    onClick={() => setModalExportarOpen(true)}
                                    className="w-full h-12 col-span-2 bg-gray-700 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center"
                                >
                                    Exportar
                                </button>
                            </>
                        )}
                    </div>
                {/* Modal de Confirmação */}
				{exibirModalConfirmacao && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
						<div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl transform transition-all ${modoNoturno ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
							<div className="text-center">
								<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
									<svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
									</svg>
								</div>
								<h3 className="text-xl font-bold mb-2">Apagar Lista?</h3>
								<p className="text-sm opacity-80 mb-6">
									Esta ação não pode ser desfeita. Todos os itens serão removidos permanentemente.
								</p>
							</div>

							<div className="flex gap-3">
								<button
									onClick={confirmarLimpeza}
									className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-600/20 transition"
								>
									Sim, Apagar
								</button>
								<button
									onClick={() => setExibirModalConfirmacao(false)}
									className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${modoNoturno ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
								>
									Cancelar
								</button>
							</div>
						</div>
					</div>
				)}

                {/* MODAL EXPORTAR */}
                {modalExportarOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div
                            className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${
                                modoNoturno
                                    ? 'bg-gray-800 text-white'
                                    : 'bg-white text-gray-800'
                            }`}
                        >
                            <h2 className="text-xl font-bold text-center mb-6">
                                Escolha o formato de exportação
                            </h2>

                            <div className="flex  gap-3">
                                 <button
                                    onClick={() => {
                                        exportarExcel();
                                        setModalExportarOpen(false);
                                    }}
                                    className="w-full h-16 bg-gray-700 text-white rounded-xl hover:bg-green-700 transition font-semibold"
                                >
                                    Exportar em Excel
                                </button>

                                <button
                                    onClick={() => {
                                        exportarPDF();
                                        setModalExportarOpen(false);
                                    }}
                                    className="w-full h-16 bg-gray-700 text-white rounded-xl hover:bg-purple-700 transition font-semibold"
                                >
                                    Exportar em PDF
                                </button>
                            </div>
                            <div className="flex mt-4 gap-3">
                                <button
                                    onClick={() => setModalExportarOpen(false)}
                                    className={`w-full h-12 rounded-xl font-semibold transition ${
                                        modoNoturno
                                            ? 'bg-red-700 hover:bg-gray-600'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ----------------------------------------------------------------- */}
                {/* MODAL DE PRODUTO */}
                {/* ----------------------------------------------------------------- */}
                {isModalOpen && (
                    <div
                        className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-all ${
                            modoNoturno ? 'bg-gray-900/80 text-gray-100' : 'bg-black/60 text-gray-900'
                        }`}
                    >
                        <div
                            className={`w-full max-w-lg p-8 rounded-2xl shadow-2xl transition-all duration-300 ${
                                modoNoturno
                                    ? 'bg-gray-800 border border-gray-700'
                                    : 'bg-white border border-gray-200'
                            }`}
                        >
                            <h1
                                className={`text-2xl font-bold mb-6 text-center ${
                                    modoNoturno ? 'text-white' : 'text-gray-900'
                                }`}
                            >
                                {editandoIndex !== null ? "Editar Produto" : "Adicionar Produto"}
                            </h1>


                            {leitorAtivo && (
                                <div className="mb-4">
                                    <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden">
                                        {/* A tag <video> DEVE ter o ID "video-scanner" */}
                                        <video 
                                            id="video-scanner" // <--- ID Crucial para o Scanner
                                            ref={videoRef} 
                                            className="w-full h-full object-cover" 
                                            autoPlay 
                                            autoFocus 
                                            focusMode 
                                            muted 
                                        />
                                        
                                        {/* Linha vermelha central */}
                                        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500 transform -translate-y-1/2 pointer-events-none"></div>
                                        {/* Borda do scanner (opcional) */}
                                        <div className="absolute inset-0 border-4 border-green-500 opacity-60 pointer-events-none"></div>
                                    </div>

                                    <p className="text-xs text-gray-400 mt-2">
                                        Aponte a câmera para o código de barras (EAN). O preenchimento será automático.
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-4 mb-4">
                                {/* Campo EAN */}
                                <input
                                    type="number"
                                    placeholder="EAN do Produto (opcional)"
                                    value={ean}
                                    onChange={(e) => setEan(e.target.value)}
                                    className={`border rounded-xl p-3 focus:ring-2 focus:outline-none transition ${
                                        modoNoturno
                                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-400'
                                            : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                                    }`}
                                />

                                {/* Botões: Buscar e Ler Código */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleSearchEan()}
                                        className={`flex-1 font-semibold rounded-xl py-2.5 shadow-sm transition-all active:scale-95 ${
                                            modoNoturno
                                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        Buscar EAN
                                    </button>

                                    <button
                                        onClick={handleScanClick}
                                        className={`flex-1 font-semibold rounded-xl py-2.5 shadow-sm transition-all active:scale-95 ${
                                            leitorAtivo
                                                ? 'bg-red-600 text-white hover:bg-red-700'
                                                : modoNoturno
                                                ? 'bg-green-500 text-white hover:bg-green-600'
                                                : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                    >
                                        {leitorAtivo ? "Parar Leitura" : "Ler Código"}
                                    </button>
                                </div>

                                {/* Campos de informações */}
                                <input
                                    type="text"
                                    placeholder="Nome do Produto"
                                    value={nomeProduto}
                                    onChange={(e) => setNomeProduto(e.target.value)}
                                    className={`border rounded-xl p-3 focus:ring-2 focus:outline-none transition ${
                                        modoNoturno
                                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-400'
                                            : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                                    }`}
                                />

                                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Valor (R$)"
                                        value={valorProduto}
                                        onChange={(e) => setValorProduto(e.target.value)}
                                        className={`border rounded-xl p-3 focus:ring-2 focus:outline-none transition ${
                                            modoNoturno
                                                ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-400'
                                                : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                                        }`}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Quantidade"
                                        value={quantidadeProduto}
                                        onChange={(e) => setQuantidadeProduto(e.target.value)}
                                        className={`border rounded-xl p-3 focus:ring-2 focus:outline-none transition ${
                                            modoNoturno
                                                ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-400'
                                                : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                                        }`}
                                    />
                                </div>

                                {/* Botões: Adicionar/Atualizar e Cancelar */}
                                <div className="flex gap-3 mt-2">
                                    <button
                                        onClick={handleAddProduto}
                                        className={`flex-1 font-semibold rounded-xl py-2.5 shadow-sm transition-all active:scale-95 ${
                                            modoNoturno
                                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        {editandoIndex !== null ? "Atualizar Produto" : "Adicionar Produto"}
                                    </button>
                                    <button
                                        onClick={handleCloseModal}
                                        disabled={leitorAtivo}
                                        className={`flex-1 font-semibold rounded-xl py-2.5 shadow-sm transition-all active:scale-95 ${
                                            leitorAtivo
                                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                                : modoNoturno
                                                ? 'bg-red-500 text-white hover:bg-red-600'
                                                : 'bg-red-600 text-white hover:bg-red-700'
                                        }`}
                                    >
                                        {leitorAtivo ? "Leitor Ativo..." : "Cancelar"}
                                    </button>
                                </div>
                            </div>

                            {erro && <p className="text-red-500 font-medium mt-2">{erro}</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ValorDefinido;