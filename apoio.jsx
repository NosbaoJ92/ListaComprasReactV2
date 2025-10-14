import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Definições de Largura OTIMIZADAS
const COL_NOME = "w-2/5"; // 40%
const COL_VALOR = "w-1/5"; // 20%
const COL_QTD = "w-1/5"; // 20%
const COL_TOTAL = "w-1/5"; // 20%

const ValorDefinido = ({ onGoHome, modoNoturno, onToggleModoNoturno }) => {

    // Inicializa valor pré-definido
    const getInitialValorPreDefinido = () => localStorage.getItem("valorPreDefinido") || '';
    const initialValorPreDefinido = getInitialValorPreDefinido();

    // Estados
    const [produtos, setProdutos] = useState([]);
    const [nomeProduto, setNomeProduto] = useState('');
    const [valorProduto, setValorProduto] = useState('');
    const [quantidadeProduto, setQuantidadeProduto] = useState('');
    const [valorPreDefinido, setValorPreDefinido] = useState(initialValorPreDefinido);
    const [erro, setErro] = useState('');
    const [editandoIndex, setEditandoIndex] = useState(null);
    const [isPDFMenuOpen, setIsPDFMenuOpen] = useState(false);
    const [produtoSelecionadoIndex, setProdutoSelecionadoIndex] = useState(null);
    const [isBudgetEditing, setIsBudgetEditing] = useState(initialValorPreDefinido === '');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Efeitos: carregar e salvar produtos
    useEffect(() => {
        const produtosSalvos = localStorage.getItem("produtosDefinido");
        if (produtosSalvos) setProdutos(JSON.parse(produtosSalvos));
    }, []);

    useEffect(() => {
        localStorage.setItem("produtosDefinido", JSON.stringify(produtos));
    }, [produtos]);

    useEffect(() => {
        localStorage.setItem("valorPreDefinido", valorPreDefinido);
    }, [valorPreDefinido]);

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
        if (index === null && !valorPreDefinido) {
            setErro('Defina o "Orçamento Máximo" antes de adicionar um produto.');
            setTimeout(() => setErro(''), 5000);
            return;
        }
        if (index !== null) {
            const produto = produtos[index];
            setNomeProduto(produto.nome);
            setValorProduto(produto.valor.toString());
            setQuantidadeProduto(produto.quantidade.toString());
            setEditandoIndex(index);
        } else {
            setNomeProduto('');
            setValorProduto('');
            setQuantidadeProduto('');
            setEditandoIndex(null);
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
    };

    const handleAddProduto = () => {
        if (!nomeProduto || !valorProduto || !quantidadeProduto) {
            setErro('Preencha todos os campos.');
            setTimeout(() => setErro(''), 3000);
            return;
        }

        const novoValor = parseFloat(valorProduto.replace(',', '.'));
        const novaQtd = parseInt(quantidadeProduto);

        if (isNaN(novoValor) || isNaN(novaQtd) || novoValor <= 0 || novaQtd <= 0) {
            setErro('Valores e quantidade devem ser números positivos válidos.');
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

    const calcularTotalCompra = () => produtos.reduce((acc, produto) => acc + produto.total, 0);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleAddProduto();
    };

    const handleRowClick = (index) => {
        setProdutoSelecionadoIndex(index === produtoSelecionadoIndex ? null : index);
    };

    const handleClearAll = () => {
        const confirmClear = window.confirm("Deseja limpar a lista de produtos E o orçamento?");
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

    const totalCompraCalculado = calcularTotalCompra().toFixed(2);
    const valorRestanteCalculado = (parseFloat(valorPreDefinido || 0) - parseFloat(totalCompraCalculado)).toFixed(2);
    const isOverBudget = valorRestanteCalculado < 0;

    // Funções PDF
    const gerarPDF = () => {
        try {
            const doc = new jsPDF();
            doc.text("Relatório de Subtração de Valor Pré-Definido", 10, 10);
            const tableColumn = ["Nome", "Valor Unitário", "Quantidade", "Total"];
            const tableRows = produtos.map(p => [p.nome, `R$ ${p.valor.toFixed(2)}`, p.quantidade, `R$ ${p.total.toFixed(2)}`]);
            doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 30;
            doc.setFontSize(12);
            doc.text(`Total da Compra: R$ ${totalCompraCalculado}`, 10, finalY + 10);
            doc.text(`Valor Pré-Definido: R$ ${parseFloat(valorPreDefinido || 0).toFixed(2)}`, 10, finalY + 18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(isOverBudget ? 255 : 34, isOverBudget ? 0 : 139, 34);
            doc.text(`Valor Restante: R$ ${valorRestanteCalculado}`, 10, finalY + 26);
            doc.save('valor-predefinido-relatorio.pdf');
            setIsPDFMenuOpen(false);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Erro ao gerar PDF.");
        }
    };

    const gerarPDFSimplesParaImpressao = () => {
        try {
            const doc = new jsPDF();
            doc.text(`Lista de Compras para o Limite: R$ ${parseFloat(valorPreDefinido || 0).toFixed(2)}`, 10, 10);
            doc.setFontSize(12);
            const tableColumn = ["Item", "Quantidade", "Marcar"];
            const tableRows = produtos.map(p => [p.nome, p.quantidade, "(   )"]);
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                styles: { fontSize: 10 },
                columnStyles: {
                    1: { cellWidth: 30, halign: 'center' },
                    2: { cellWidth: 30, halign: 'center' }
                }
            });
            doc.output('dataurlnewwindow');
            setIsPDFMenuOpen(false);
        } catch (error) {
            console.error("Erro ao gerar PDF Simples:", error);
            alert("Erro ao gerar PDF Simples.");
        }
    };

    return (
        <div className={`min-h-screen relative flex flex-col transition-colors duration-500 ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
            
            {/* Botões fixos */}
            {onGoHome && (
                <button onClick={onGoHome} className={`fixed top-4 left-4 z-50 p-3 rounded-full shadow-lg transition duration-300
                    ${modoNoturno ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-200'}`}>
                    🏠
                </button>
            )}
            <button onClick={onToggleModoNoturno} className={`fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition duration-300
                ${modoNoturno ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-200'}`}>
                {modoNoturno ? '☀️' : '🌙'}
            </button>

            {/* Cabeçalho */}
            <header className={`sticky top-0 z-40 w-full transition-colors duration-500 pt-16 pb-4 ${modoNoturno ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <div className="container mx-auto max-w-4xl px-6">
                    <h1 className="text-center text-4xl font-extrabold pb-4">Controle de Orçamento 🎯</h1>

                    <div className={`p-4 rounded-xl shadow-lg border-2 mb-4 ${isOverBudget ? 'border-red-500' : 'border-blue-500'} ${modoNoturno ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-lg font-semibold">Orçamento Máximo (R$)</label>
                            {!isBudgetEditing && (
                                <button onClick={() => setIsBudgetEditing(true)}
                                    className="bg-orange-500 text-white font-semibold rounded-lg p-2 px-4 text-sm hover:bg-orange-600 transition">
                                    Editar
                                </button>
                            )}
                        </div>
                        {isBudgetEditing ? (
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Ex: 100.00"
                                    value={valorPreDefinido}
                                    onChange={(e) => setValorPreDefinido(e.target.value)}
                                    className={`border rounded-lg p-2 w-full text-lg focus:ring-2 focus:ring-offset-2
                                        ${modoNoturno ? 'bg-gray-700 text-gray-100 border-gray-600 focus:ring-blue-400' : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-blue-500'}`}
                                />
                                <button onClick={() => handleSetBudget(valorPreDefinido)}
                                    className="bg-green-500 text-white font-semibold rounded-lg p-2 px-4 hover:bg-green-600 transition">
                                    Salvar
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <p className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
                                    R$ {parseFloat(valorPreDefinido || 0).toFixed(2)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Conteúdo */}
            <div className="container mx-auto max-w-4xl px-6 flex-grow overflow-y-auto mt-2">
                {erro && (
                    <div className={`p-3 mb-4 rounded-lg font-semibold text-center ${erro.includes('Orçamento') ? 'bg-yellow-400 text-gray-900' : 'bg-red-500 text-white'}`}>
                        {erro}
                    </div>
                )}

                {/* Tabela */}
                <div className={`p-4 mb-4 rounded-xl shadow-lg overflow-y-scroll max-h-96 border ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    {/* Cabeçalho */}
                    <div className="hidden sm:block border-b-2 border-gray-300 dark:border-gray-600">
                        <div className="flex uppercase text-sm
