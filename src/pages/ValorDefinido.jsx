import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

// Definições de Largura OTIMIZADAS (para manter a consistência visual)
const COL_NOME = "w-2/5"; // 40%
const COL_VALOR = "w-1/5"; // 20%
const COL_QTD = "w-1/5"; // 20%
const COL_TOTAL = "w-1/5"; // 20%

// O componente agora recebe modoNoturno e onToggleModoNoturno via props
const ValorDefinido = ({ onGoHome, modoNoturno, onToggleModoNoturno }) => {

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

    // isBudgetEditing inicializa como TRUE se valorPreDefinido for vazio
    const [isBudgetEditing, setIsBudgetEditing] = useState(initialValorPreDefinido === '');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ESTADOS PARA O SCANNER/EAN
    const [ean, setEan] = useState("");
    const [leitorAtivo, setLeitorAtivo] = useState(false);
    const codeReaderRef = useRef(null);
    const videoRef = useRef(null); // Referência para o elemento de vídeo (scanner)


    // EFEITOS (Carregar/Salvar)
    useEffect(() => {
        const produtosSalvos = localStorage.getItem("produtosDefinido");
        if (produtosSalvos) {
            setProdutos(JSON.parse(produtosSalvos));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("produtosDefinido", JSON.stringify(produtos));
    }, [produtos]);

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


    // EFEITO: Lógica do Scanner
    useEffect(() => {
        if (leitorAtivo && videoRef.current) {
            // Inicializa o leitor apenas se não estiver inicializado
            if (!codeReaderRef.current) {
                codeReaderRef.current = new BrowserMultiFormatReader();
            }

            // Inicia a leitura do código de barras
            codeReaderRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
                if (result) {
                    const capturedEan = result.getText();
                    setEan(capturedEan);
                    
                    // Chama handleSearchEan com o EAN capturado para iniciar a busca
                    handleSearchEan(capturedEan); 
                    
                    // Desativa o leitor após a leitura
                    handleScanClick(); 

                }
                if (err && !(err instanceof NotFoundException)) {
                    // console.error(err);
                }
            });

            // Parar o leitor ao sair do modo de leitura
            return () => {
                if (codeReaderRef.current) {
                    codeReaderRef.current.reset();
                }
            };
        }
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
        } else {
            setErro('Por favor, insira um valor numérico positivo.');
            setTimeout(() => setErro(''), 3000);
        }
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
            setNomeProduto(produto.nome);
            setValorProduto(produto.valor.toString());
            setQuantidadeProduto(produto.quantidade.toString());
            setEditandoIndex(index);
            setEan('');
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
        
        // Desliga o scanner se estiver ativo (handleScanClick já tem a lógica de reset)
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
            nome: nomeProduto,
            valor: novoValor,
            quantidade: novaQtd,
            total: novoValor * novaQtd,
        };

        if (editandoIndex !== null) {
            const produtosAtualizados = produtos.map((produto, index) =>
                index === editandoIndex ? novoProduto : produto
            );
            setProdutos(produtosAtualizados);
        } else {
            setProdutos([...produtos, novoProduto]);
        }

        handleCloseModal();
        setProdutoSelecionadoIndex(null);
    };

    const handleEditProduto = (index) => {
        setProdutoSelecionadoIndex(null);
        handleOpenModal(index);
    };

    const handleDeleteProduto = (index) => {
        const produtosAtualizados = produtos.filter((_, i) => i !== index);
        setProdutos(produtosAtualizados);
        setProdutoSelecionadoIndex(null);
    };

    const calcularTotalCompra = () => {
        return produtos.reduce((acc, produto) => acc + produto.total, 0);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAddProduto();
        }
    };

    const handleRowClick = (index) => {
        setProdutoSelecionadoIndex(index === produtoSelecionadoIndex ? null : index);
    };

    // Limpa tudo (produtos e valor pré-definido)
    const handleClearAll = () => {
        const confirmClear = window.confirm("Tem certeza de que deseja limpar a lista de produtos E o valor do orçamento? Esta ação é irreversível.");

        if (confirmClear) {
            setProdutos([]);
            setValorPreDefinido('');
            setIsBudgetEditing(true);
            localStorage.removeItem("produtosDefinido");
            localStorage.removeItem("valorPreDefinido");

            setProdutoSelecionadoIndex(null);
            setErro('Lista de compras e orçamento foram limpos.');
            setTimeout(() => setErro(''), 3000);
        }
    };

    // FUNÇÕES DE PDF (Simuladas)
    const gerarPDF = () => { 
        setErro("Simulação de Geração de PDF Detalhado...");
        setTimeout(() => setErro(""), 3000);
    };
    const gerarPDFSimplesParaImpressao = () => { 
        setErro("Simulação de Geração de PDF Simples...");
        setTimeout(() => setErro(""), 3000);
    };

    const totalCompraCalculado = calcularTotalCompra().toFixed(2);
    const valorRestanteCalculado = (parseFloat(valorPreDefinido || 0) - parseFloat(totalCompraCalculado)).toFixed(2);
    const isOverBudget = valorRestanteCalculado < 0;

    // Classe condicional para os inputs do modal
    const inputModalClasses = `border rounded-lg p-3 w-full text-base focus:ring-blue-500 focus:border-blue-500 
                              ${modoNoturno ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`;

    // --- RENDERIZAÇÃO DO COMPONENTE ---
    return (
        <div className={`min-h-screen relative flex flex-col transition-colors duration-500 ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>

            {/* Botões fixos (Home/Tema) */}
            {onGoHome && (
                <button
                    onClick={onGoHome}
                    className="fixed top-4 left-4 z-50 p-3 rounded-full shadow-lg transition duration-300 text-sm font-semibold
                                        bg-white text-gray-800 hover:bg-gray-200
                                        dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                >
                    🏠
                </button>
            )}
            <button
                onClick={onToggleModoNoturno}
                className="fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition duration-300 text-sm font-semibold
                                        bg-white text-gray-800 hover:bg-gray-200
                                        dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
                {modoNoturno ? '☀️' : '🌙'}
            </button>

            {/* CABEÇALHO FIXO (Título, Orçamento e Resumo) */}
            <header className={`sticky top-0 z-40 w-full transition-colors duration-500 pt-16 pb-4 ${modoNoturno ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <div className="container mx-auto max-w-4xl px-6">
                    <h1 className="text-center text-4xl font-extrabold pb-4">
                        Controle de Orçamento 🎯
                    </h1>

                    {/* Seção de Valor Pré-Definido (Fixo/Editável) */}
                    <div className={`p-4 rounded-xl shadow-lg border-2 mb-4 ${isOverBudget ? 'border-red-500' : 'border-blue-500'} ${modoNoturno ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-lg font-semibold">Orçamento Máximo (R$)</label>
                            {/* Botão de Editar visível apenas fora do modo de edição */}
                            {!isBudgetEditing && (
                                <button
                                    onClick={() => setIsBudgetEditing(true)}
                                    className="bg-orange-500 text-white font-semibold rounded-lg p-2 px-4 text-sm hover:bg-orange-600 transition"
                                >
                                    Editar
                                </button>
                            )}
                        </div>

                        {isBudgetEditing ? (
                            <div className='flex gap-2'>
                                <input
                                    type="number"
                                    placeholder="Ex: 100.00"
                                    value={valorPreDefinido}
                                    onChange={(e) => setValorPreDefinido(e.target.value)}
                                    className={`border rounded-lg p-2 w-full text-lg focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 ${modoNoturno ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'}`}
                                />
                                <button
                                    onClick={() => handleSetBudget(valorPreDefinido)}
                                    className="bg-green-500 text-white font-semibold rounded-lg p-2 px-4 hover:bg-green-600 transition"
                                >
                                    Salvar
                                </button>
                            </div>
                        ) : (
                            <div className='flex justify-between items-center'>
                                <p className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
                                    R$ {parseFloat(valorPreDefinido || 0).toFixed(2)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Conteúdo que ROLA (Tabela, Botões e Totais Finais) */}
            <div className="container mx-auto max-w-4xl px-6 flex-grow overflow-y-auto mt-2 ">

                {/* Mensagem de Erro (Fica fixa, se houver) */}
                {erro && (
                    <div className={`p-3 mb-4 rounded-lg font-semibold text-center ${erro.includes('Orçamento') ? 'bg-yellow-400 text-gray-900' : 'bg-red-500 text-white'}`}>
                        {erro}
                    </div>
                )}

                {/* Área da Tabela */}
                <div className={`p-4 mb-4 rounded-xl shadow-lg overflow-y-scroll max-h-96 border ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    {/* CABEÇALHO DA TABELA (Desktop/Tablet) */}
                    <div className="hidden sm:block border-b-2 border-gray-300 dark:border-gray-600">
                        <div className="flex uppercase text-sm font-bold w-full">
                            <div className={`px-4 py-3 text-left ${COL_NOME}`}>Produto</div>
                            <div className={`px-4 py-3 text-right ${COL_VALOR}`}>Valor Und.</div>
                            <div className={`px-4 py-3 text-center ${COL_QTD}`}>Qtd.</div>
                            <div className={`px-4 py-3 text-right ${COL_TOTAL}`}>Total</div>
                        </div>
                    </div>

                    {/* CORPO DA TABELA */}
                    <div>
                        {produtos.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="font-semibold text-lg mb-2">Lista de itens vazia. 📝</p>
                                <p>Adicione produtos para subtrair do seu orçamento.</p>
                            </div>
                        ) : (
                            <div>
                                {produtos.map((produto, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleRowClick(index)}
                                        className={`flex flex-col sm:flex-row border-b dark:border-gray-700 transition duration-100 cursor-pointer w-full relative
                                                        ${index === produtoSelecionadoIndex ? 'bg-blue-100/50 dark:bg-blue-900/70' : (index % 2 === 0 ? ' ' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50')}`}
                                    >
                                        {/* LAYOUT MOBILE (Detalhes do Cartão) */}
                                        <div className={`p-4 sm:hidden w-full`}>
                                            <div className="font-extrabold text-lg mb-2">{produto.nome}</div>
                                            <div className="grid grid-cols-3 gap-y-1 gap-x-4 text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-400">Valor Und.:</span>
                                                    <span className="font-medium">R$ {produto.valor.toFixed(2)}</span>
                                                </div>
                                                <div className="flex flex-col text-center">
                                                    <span className="font-semibold text-gray-400">Qtd.:</span>
                                                    <span className="font-medium">{produto.quantidade}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-semibold text-gray-400">Total Item:</span>
                                                    <span className="text-lg font-bold text-green-500">R$ {produto.total.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* LAYOUT DESKTOP (Linhas da Tabela) */}
                                        <div className="hidden sm:flex w-full">
                                            <div className={`px-4 py-3 text-left flex items-center ${COL_NOME}`}>{produto.nome}</div>
                                            <div className={`px-4 py-3 text-right flex items-center justify-end ${COL_VALOR}`}>R$ {produto.valor.toFixed(2)}</div>
                                            <div className={`px-4 py-3 text-center flex items-center justify-center ${COL_QTD}`}>{produto.quantidade}</div>
                                            <div className={`px-4 py-3 font-semibold text-right flex items-center justify-end ${COL_TOTAL} text-lg text-green-600 dark:text-green-400`}>R$ {produto.total.toFixed(2)}</div>
                                        </div>

                                        {/* POP-UP DE AÇÕES */}
                                        {index === produtoSelecionadoIndex && (
                                            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex gap-2 z-20 p-4 rounded-lg bg-white/70 backdrop-blur-sm dark:bg-gray-900/70 shadow-md">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditProduto(index); }}
                                                    className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
                                                    title="Editar"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteProduto(index); }}
                                                    className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
                                                    title="Excluir"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Botões de Ação da Tabela */}
                <div className="p-4 mb-6 text-center flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-blue-600 text-white font-semibold rounded-lg p-3 px-8 hover:bg-blue-700 transition shadow-lg w-full sm:w-auto"
                    >
                        + Adicionar Novo Produto
                    </button>
                </div>

                {/* Saldo Restante e Total de Compras */}
                <div className={`p-4 rounded-xl shadow-lg border-2 mb-6 ${isOverBudget ? 'border-red-500 bg-red-100/30 dark:bg-red-900/40' : 'border-green-500 bg-green-100/30 dark:bg-green-900/40'} font-bold`}>
                    <div className="flex justify-between items-center mb-2 border-b pb-2 border-gray-300 dark:border-gray-600">
                        <h3 className="text-xl">Total de Compras:</h3>
                        <span className="text-2xl text-green-600 dark:text-green-400">R$ {totalCompraCalculado}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <h3 className="text-2xl">Saldo Restante:</h3>
                        <span className={`text-3xl ${isOverBudget ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                            R$ {valorRestanteCalculado}
                        </span>
                    </div>
                </div>

                {/* Rodapé da Página: Botões de PDF e Limpar Tudo */}
                <div className="flex flex-col sm:flex-row justify-between w-full mt-4 pb-6 gap-4">
                    {/* <div className="flex gap-4">
                        <button
                            onClick={gerarPDF}
                            className="bg-gray-500 text-white font-semibold rounded-lg p-3 px-8 hover:bg-gray-600 transition shadow-lg w-full sm:w-auto"
                        >
                            Exportar PDF
                        </button>
                        <button
                            onClick={gerarPDFSimplesParaImpressao}
                            className="bg-gray-500 text-white font-semibold rounded-lg p-3 px-8 hover:bg-gray-600 transition shadow-lg w-full sm:w-auto"
                        >
                            Imprimir
                        </button>
                    </div> */}
                    <button
                        onClick={handleClearAll}
                        className="bg-red-500 text-white font-semibold rounded-lg p-3 px-8 hover:bg-red-600 transition shadow-lg w-full sm:w-auto mt-4 sm:mt-0"
                    >
                        🗑️ Limpar Tudo
                    </button>
                </div>
            </div>

            {/* MODAL DE ADICIONAR/EDITAR PRODUTO */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                    <div className={`rounded-xl p-8 w-full max-w-md shadow-2xl ${modoNoturno ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                        {/* Título */}
                        <h2 className={`text-2xl font-bold mb-6 text-center ${modoNoturno ? 'text-gray-100' : 'text-gray-900'}`}>
                            {editandoIndex !== null ? 'Editar Produto' : 'Adicionar Produto'}
                        </h2>

                        {leitorAtivo && (
                        <div className="mb-4">
                            <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden">
                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay autoFocus focusMode muted />
                                
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

                        <div className="space-y-4">
                            {/* 1. EAN INPUT (Full Width) */}
                            <input
                                type="text"
                                placeholder="EAN do Produto"
                                value={ean}
                                onChange={(e) => setEan(e.target.value)}
                                disabled={leitorAtivo}
                                className={inputModalClasses} // Classe condicional aplicada
                            />

                            {/* 2. BOTÕES DE AÇÃO DO EAN (Lado a Lado) */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleSearchEan(ean)} 
                                    className="bg-blue-600 text-white font-semibold rounded-lg p-3 w-1/2 hover:bg-blue-700 transition shadow-md"
                                >
                                    Buscar
                                </button>
                                <button
                                    onClick={handleScanClick}
                                    className={`font-semibold rounded-lg p-3 w-1/2 transition shadow-md
                                        ${leitorAtivo ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'} text-white
                                    `}
                                >
                                    {leitorAtivo ? 'Parar Leitor' : 'Ler Código'}
                                </button>
                            </div>
                            
                            {/* 3. NOME DO PRODUTO (Full Width) */}
                            <input
                                type="text"
                                placeholder="Nome do Produto"
                                value={nomeProduto}
                                onChange={(e) => setNomeProduto(e.target.value)}
                                className={inputModalClasses} // Classe condicional aplicada
                            />

                            {/* 4. VALOR E QUANTIDADE (Lado a Lado) */}
                            <div className="flex gap-4">
                                <input
                                    type="number"
                                    placeholder="Valor (R$)"
                                    value={valorProduto}
                                    onChange={(e) => setValorProduto(e.target.value)}
                                    className={inputModalClasses.replace('w-full', 'w-1/2')} // Classe condicional aplicada
                                />
                                <input
                                    type="number"
                                    placeholder="Quantidade"
                                    value={quantidadeProduto}
                                    onChange={(e) => setQuantidadeProduto(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={inputModalClasses.replace('w-full', 'w-1/2')} // Classe condicional aplicada
                                />
                            </div>
                        </div>

                        {/* Mensagem de erro dentro do Modal */}
                        {erro && (
                            <p className={`font-medium mt-4 ${modoNoturno ? 'text-red-400' : 'text-red-500'}`}>{erro}</p>
                        )}

                        {/* 5. BOTÕES DE AÇÃO PRINCIPAL (Lado a Lado - Fundo do Modal) */}
                        <div className="mt-6 flex gap-4">
                            {/* Botão Adicionar/Atualizar (Azul) */}
                            <button
                                onClick={handleAddProduto}
                                className="bg-blue-600 text-white font-semibold rounded-lg p-3 hover:bg-blue-700 transition w-1/2 shadow-md"
                            >
                                {editandoIndex !== null ? 'Atualizar Produto' : 'Adicionar Produto'}
                            </button>
                            {/* Botão Cancelar (Cinza) - AGORA OTIMIZADO */}
                            <button
                                onClick={handleCloseModal} 
                                disabled={leitorAtivo} 
                                className={`font-semibold rounded-lg p-3 transition w-1/2 shadow-md 
                                    ${leitorAtivo 
                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                        : 'bg-red-500 text-white hover:bg-red-600' // Estilo padrão para o Cancelar
                                    }`}
                            >
                                {leitorAtivo ? 'Leitor Ativo...' : 'Cancelar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ValorDefinido;