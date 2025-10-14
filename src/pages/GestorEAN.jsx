import React, { useState, useEffect } from "react";
// O import do "@zxing/library" e a lógica de scanner foram removidos para resolver o erro de compilação.

// ⚠️ Configuração da API EANdata fornecida pelo usuário
const EANDATA_API_KEY = "4210726968ED3C18";
const EANDATA_API_URL_BASE = `https://eandata.com/feed/?v=3&keycode=${EANDATA_API_KEY}&mode=json&find=`;
const MOCKAPI_URL = "https://68ed848edf2025af780067e3.mockapi.io/gestor/produtos";

const GestorEAN = ({ onGoHome }) => {
    // 🔹 Estados e Funções para Tema Simplificado (Componente Autônomo)
    const [modoNoturno, setModoNoturno] = useState(false);
    const toggleModoNoturno = () => setModoNoturno(prev => !prev);
    
    // 🔹 Estados
    const [ean, setEan] = useState("");
    const [nomeProduto, setNomeProduto] = useState("");
    const [leitorAtivo, setLeitorAtivo] = useState(false); // Mock do scanner
    const [produtosColetados, setProdutosColetados] = useState([]);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    
    // 🆕 Estado para controle de Edição
    const [editingId, setEditingId] = useState(null); // ID do produto sendo editado
    // 🆕 Estado para controle da Confirmação de Limpeza
    const [showClearConfirmation, setShowClearConfirmation] = useState(false); 

    // 🔹 Persistência dos produtos e tema no localStorage
    useEffect(() => {
        const produtosSalvos = localStorage.getItem("produtosColetados");
        if (produtosSalvos) setProdutosColetados(JSON.parse(produtosSalvos));
        const temaSalvo = localStorage.getItem('modoNoturno') === 'true';
        setModoNoturno(temaSalvo);
    }, []);

    useEffect(() => {
        localStorage.setItem("produtosColetados", JSON.stringify(produtosColetados));
    }, [produtosColetados]);
    
    useEffect(() => {
        localStorage.setItem('modoNoturno', modoNoturno);
    }, [modoNoturno]);
    

    // 🔹 Scanner Mock (apenas para controlar a interface)
    useEffect(() => {
        if (leitorAtivo) {
            setErro("A funcionalidade de leitura de código está desativada. Insira o EAN manualmente.");
        } else {
            if (erro.includes("leitura de código")) setErro("");
        }
    }, [leitorAtivo, erro]);


    // 🟢 FUNÇÃO DE ADIÇÃO/EDIÇÃO (UNIFICADA)
    const handleSubmitProduto = () => {
        if (!ean || !nomeProduto) {
            setErro("Preencha o EAN e o Nome do Produto!");
            setTimeout(() => setErro(""), 1500);
            return;
        }

        if (editingId) {
            // Lógica de EDIÇÃO
            setProdutosColetados(prevProdutos =>
                prevProdutos.map(p =>
                    p.id === editingId
                        ? { ...p, ean: ean, nome: nomeProduto }
                        : p
                )
            );
            setEditingId(null);
            setSucesso("Produto editado com sucesso!");
        } else {
            // Lógica de ADIÇÃO
            const novoProduto = {
                id: Date.now(), 
                ean,
                nome: nomeProduto,
            };
            setProdutosColetados(prevProdutos => [...prevProdutos, novoProduto]);
            setSucesso("Produto adicionado à lista local.");
        }

        setEan("");
        setNomeProduto("");
        setTimeout(() => setSucesso(""), 1500);
    };

    // ✏️ NOVO: Inicia o modo de edição
    const handleStartEdit = (produto) => {
        setEditingId(produto.id);
        setEan(produto.ean);
        setNomeProduto(produto.nome);
        setLeitorAtivo(false); // Garante que o scanner esteja desligado
        setErro(""); // Limpa erro
        setSucesso("Modo de edição ativado. Altere os campos e clique em 'Salvar Alterações'.");
    };

    // ✏️ NOVO: Cancela o modo de edição
    const handleCancelEdit = () => {
        setEditingId(null);
        setEan("");
        setNomeProduto("");
        setErro("");
        setSucesso("Edição cancelada.");
    };
    
    // 🗑️ FUNÇÃO PARA EXCLUIR UM ITEM
    const handleRemoverProduto = (id) => {
        const novaLista = produtosColetados.filter(produto => produto.id !== id);
        setProdutosColetados(novaLista);
        setSucesso("Produto removido com sucesso.");
        setTimeout(() => setSucesso(""), 1500);
    };

    // 🗑️ INICIA A CONFIRMAÇÃO PARA EXCLUIR TODOS OS ITENS
    const handleLimparTudo = () => {
        setShowClearConfirmation(true);
    };
    
    // 🗑️ CONFIRMA A EXCLUSÃO DE TODOS
    const confirmLimparTudo = () => {
        setProdutosColetados([]);
        setShowClearConfirmation(false);
        setSucesso("Lista de produtos esvaziada.");
        setTimeout(() => setSucesso(""), 1500);
    };

    // 🗑️ CANCELA A EXCLUSÃO DE TODOS
    const cancelLimparTudo = () => {
        setShowClearConfirmation(false);
    };


    // 🚀 FUNÇÃO DE ENVIO COM LÓGICA DE FILTRO EANdata (Mantida)
    const checkEanInExternalApi = async (ean) => {
        try {
            // ... (Lógica de verificação EANdata)
            const urlCompleta = `${EANDATA_API_URL_BASE}${ean}`;
            
            const response = await fetch(urlCompleta, { method: "GET" });
            const data = await response.json();
            
            if (data.status === 'success' && data.product) {
                return { found: true, message: `EAN ${ean} encontrado no EANdata. Será IGNORADO.` };
            }

            return { found: false, message: `EAN ${ean} não encontrado no EANdata. Pronto para envio.` };

        } catch (error) {
            console.error("Erro na consulta EANdata:", error);
            return { found: false, message: `Falha na conexão/API EANdata para ${ean}. Enviando para MockAPI (BACKUP).` };
        }
    };

    const handleEnviarMockAPI = async () => {
        if (produtosColetados.length === 0) {
            setErro("Nenhum produto para enviar.");
            setTimeout(() => setErro(""), 2000);
            return;
        }

        let enviados = 0;
        let ignorados = 0;
        const produtosRestantes = [];

        try {
            for (const produto of produtosColetados) {
                setErro(`Verificando EAN ${produto.ean}...`);
                
                const checkResult = await checkEanInExternalApi(produto.ean);
                
                if (checkResult.found) {
                    ignorados++;
                    produtosRestantes.push(produto); // Mantém na lista local
                } else {
                    const { id, ...produtoApi } = produto; 
                    await fetch(MOCKAPI_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(produtoApi),
                    });
                    enviados++;
                }
            }
            
            setErro("");
            setSucesso(`Processo concluído: ${enviados} enviados para o MockAPI. ${ignorados} ignorados.`);
            setTimeout(() => setSucesso(""), 6000);
            
            setProdutosColetados(produtosRestantes); 

        } catch (err) {
            console.error("Erro durante o processo de envio:", err);
            setErro("Erro fatal ao processar envios. Verifique o console.");
            setTimeout(() => setErro(""), 5000);
        }
    };


    return (
        <div className={`min-h-screen pt-12 p-6 relative flex flex-col ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
            
            {/* Botões de Ação Fixos */}
            <button
                onClick={onGoHome}
                className="fixed top-4 left-4 z-50 p-3 rounded-full shadow-lg transition duration-300 bg-white text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                title="Voltar"
            >
                🏠
            </button>
            <button
                onClick={toggleModoNoturno}
                className="fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition duration-300 bg-white text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                title="Alternar Tema"
            >
                {modoNoturno ? '☀️' : '🌙'}
            </button>

            <div className="container mx-auto max-w-4xl pt-8 flex-grow">
                <h1 className="text-3xl px-6 font-bold text-center mb-8">
                    Coletor de Produtos (Apenas EAN e Nome)
                </h1>

                {/* Área de MOCK do Scanner */}
                {leitorAtivo && (
                    <div className="mb-4 relative w-full max-w-sm mx-auto rounded-xl shadow-xl p-8 text-center bg-gray-200 dark:bg-gray-800 border-2 border-red-500">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">Scanner Indisponível</p>
                        <p className="text-sm mt-2">O leitor de código de barras está desativado. Insira o EAN manualmente.</p>
                    </div>
                )}

                <div className="max-w-md mx-auto flex flex-col gap-3">
                    {/* Campos de Input (Reutilizados para Adição e Edição) */}
                    <input
                        type="text"
                        placeholder="EAN / Código de Barras"
                        value={ean}
                        onChange={e => setEan(e.target.value)}
                        className={`border p-3 rounded-xl text-gray-700 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${leitorAtivo ? 'opacity-50' : ''}`}
                        disabled={leitorAtivo}
                    />
                    <input
                        type="text"
                        placeholder="Nome do Produto"
                        value={nomeProduto}
                        onChange={e => setNomeProduto(e.target.value)}
                        className={`border p-3 rounded-xl text-gray-700 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${leitorAtivo ? 'opacity-50' : ''}`}
                        disabled={leitorAtivo}
                    />
                    
                    <div className="flex gap-3 mt-2">
                        {/* Botão de Ação Principal (Adicionar ou Salvar) */}
                        <button
                            onClick={handleSubmitProduto}
                            className={`flex-1 bg-blue-600 text-white font-semibold rounded-xl py-3 shadow-md hover:bg-blue-700 transition transform hover:scale-[1.01] ${leitorAtivo ? 'opacity-50' : ''}`}
                            disabled={leitorAtivo}
                        >
                            {editingId ? "Salvar Alterações" : "Adicionar Produto"}
                        </button>
                        
                        {/* Botão de Cancelar Edição (Apenas em modo de edição) */}
                        {editingId && (
                            <button
                                onClick={handleCancelEdit}
                                className="w-1/3 bg-gray-500 text-white font-semibold rounded-xl py-3 shadow-md hover:bg-gray-600 transition transform hover:scale-[1.01]"
                            >
                                Cancelar
                            </button>
                        )}

                        {/* Botão de Leitor/Scanner */}
                        {!editingId && (
                            <button
                                onClick={() => setLeitorAtivo(!leitorAtivo)}
                                className={`flex-1 font-semibold rounded-xl py-3 shadow-md transition transform hover:scale-[1.01] ${
                                    leitorAtivo ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                            >
                                {leitorAtivo ? "Parar Leitura (Mock)" : "Ler Código (Mock)"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Área de Mensagens */}
                {(erro || sucesso) && (
                    <div className={`max-w-md mx-auto mt-4 p-3 rounded-xl text-center font-medium shadow-lg ${erro ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'}`}>
                        {erro || sucesso}
                    </div>
                )}


                {/* Lista de Produtos Coletados */}
                {produtosColetados.length > 0 && (
                    <div className="mt-6 max-w-md mx-auto p-6 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <h2 className="text-xl font-bold mb-3">Produtos Coletados ({produtosColetados.length})</h2>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-60 overflow-y-auto mb-4">
                            {produtosColetados.map((p) => (
                                <li key={p.id} className="py-3 flex justify-between items-center transition hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <span className={`font-medium truncate mr-2 ${p.id === editingId ? 'text-blue-500' : ''}`}>{p.nome}</span>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-mono px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                                            EAN: {p.ean}
                                        </span>
                                        
                                        {/* ✏️ NOVO: BOTÃO EDITAR ITEM */}
                                        <button
                                            onClick={() => handleStartEdit(p)}
                                            className="text-gray-500 hover:text-blue-600 p-1 rounded-full transition"
                                            title="Editar item"
                                            disabled={!!editingId} // Desabilita se já estiver editando outro
                                        >
                                            ✏️
                                        </button>

                                        {/* 🗑️ BOTÃO EXCLUIR ITEM */}
                                        <button
                                            onClick={() => handleRemoverProduto(p.id)}
                                            className="text-gray-500 hover:text-red-600 p-1 rounded-full transition"
                                            title="Excluir item"
                                        >
                                            ❌
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        
                        {/* 🗑️ BOTÕES DE AÇÃO EM LOTE */}
                        <div className="flex w-full gap-2">
                            <button
                                onClick={handleEnviarMockAPI}
                                className="flex-1 w-1/2 bg-purple-600 text-white font-semibold rounded-xl py-3 shadow-md hover:bg-purple-700 transition transform hover:scale-[1.01]"
                                disabled={!!editingId}
                            >
                                Enviar ({produtosColetados.length})
                            </button>
                            <button
                                onClick={handleLimparTudo}
                                className="w-1/2 bg-red-600 text-white font-semibold rounded-xl py-3 shadow-md hover:bg-red-700 transition transform hover:scale-[1.01]"
                                title="Limpar toda a lista"
                                disabled={!!editingId}
                            >
                                Limpar Tudo
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 🗑️ NOVO: MODAL DE CONFIRMAÇÃO DE LIMPEZA */}
            {showClearConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className={`p-6 rounded-xl shadow-2xl max-w-xs w-full text-center ${modoNoturno ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                        <h3 className="text-xl font-bold mb-4">Confirma Limpeza?</h3>
                        <p className="mb-6">Você tem certeza que deseja excluir todos os {produtosColetados.length} produtos coletados localmente?</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={confirmLimparTudo}
                                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                            >
                                Sim, Limpar
                            </button>
                            <button
                                onClick={cancelLimparTudo}
                                className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition"
                            >
                                Não, Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestorEAN;
