import { useState, useEffect, useRef } from "react";
// Importações de componentes/libs externas. Se estiverem em um ambiente React/Next, essas importações devem funcionar:
import { BrowserMultiFormatReader } from "@zxing/library";
import { useTheme } from '../components/ThemeContext';
import SidebarMenu from '../components/SidebarMenu'; // Assumindo que este componente existe e funciona corretamente

/**
 * Tela principal do sistema após o login.
 * 🔑 AJUSTE: usuarioLogado agora é um OBJETO: { role: 'admin'/'usuario', email: '...', name: '...' }
 * @param {object} usuarioLogado - Objeto com informações do usuário logado, passado pelo App.jsx.
 * @param {function(): void} onGoHome - Função para voltar para a tela inicial de seleção de modo.
 * @param {function(): void} onLogoutSuccess - A função de logout REAL, passada pelo App.jsx.
 * @param {function(): void} onToggleModoNoturno - Função para alternar o tema, passada pelo App.jsx.
 */

const GestorEAN = ({ onGoHome, usuarioLogado, onLogoutSuccess, onToggleModoNoturno }) => {
    
    // 🔑 CORREÇÃO CRÍTICA: Declaração dos estados faltantes
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState('ean'); // Define uma página ativa inicial para o menu

    const isAdmin = usuarioLogado?.role === 'admin';
    const userEmail = usuarioLogado?.email || 'usuario@sistema.com';
    const userName = usuarioLogado?.name || (isAdmin ? "Admin" : "Usuário Comum");

    const [ean, setEan] = useState("");
    const [nomeProduto, setNomeProduto] = useState("");
    const [valorProduto, setValorProduto] = useState("");
    const [leitorAtivo, setLeitorAtivo] = useState(false);
    const [produtosColetados, setProdutosColetados] = useState([]);
    const [erro, setErro] = useState("");
    const codeReaderRef = useRef(null);
    
    // 🔹 Tema via contexto
    // CORREÇÃO: useTheme deve ser chamado aqui (antes, estava sendo chamado fora do escopo funcional)
    const { modoNoturno, toggleModoNoturno } = useTheme(); 

    const closeMenu = () => setIsMenuOpen(false);
    const toggleMenu = () => setIsMenuOpen(prev => !prev);
    
    // --- Funções de Logout ---
    const handleLogout = () => {
        console.log("Saindo do sistema...");
        closeMenu();
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
            // CORREÇÃO: Chama diretamente toggleModoNoturno do useTheme, que gerencia a lógica interna.
            toggleModoNoturno(); 
            return;
        }
        
        // Simulação de navegação para outras telas
        if (pageId === 'gestor') {
            if (!isAdmin) {
                alert("Acesso negado: Você não tem permissão de administrador.");
                return;
            }
            // Não deve navegar, apenas simular, então mantém-se na página atual
            alert(`Navegação simulada para ${pageId}.`);
        } else if (pageId === 'settings') {
            alert(`Navegação simulada para ${pageId}.`);
        }
        
        setCurrentPage(pageId); 
    };
    
    // Estrutura de Opções base
    const baseMenuOptions = [
        { id: 'ean', icon: '🔍', type: 'link', description: 'Coletor EAN (Atual)' }, // Adicionei a página EAN para ter uma ativa
        { id: 'home', icon: '🏠', type: 'link', description: 'Voltar para a seleção de modo' },
        { id: 'settings', icon: '⚙️', type: 'link', description: 'Ajustes do sistema' },
        { id: 'themeToggle', icon: modoNoturno ? '☀️' : '🌙', type: 'toggleTheme', description: `Tema: ${modoNoturno ? 'Claro' : 'Escuro'}` },
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

    // 🔹 Persistência dos produtos no localStorage
    useEffect(() => {
        const produtosSalvos = localStorage.getItem("produtosColetados");
        if (produtosSalvos) setProdutosColetados(JSON.parse(produtosSalvos));
    }, []);

    useEffect(() => {
        localStorage.setItem("produtosColetados", JSON.stringify(produtosColetados));
    }, [produtosColetados]);

    // 🔹 Scanner
    useEffect(() => {
        if (!leitorAtivo) {
            if (codeReaderRef.current) codeReaderRef.current.reset();
            return;
        }

        const initScanner = async () => {
            try {
                // A classe BrowserMultiFormatReader é importada no topo do arquivo.
                const codeReader = new BrowserMultiFormatReader();
                codeReaderRef.current = codeReader;

                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(d => d.kind === "videoinput");

                const backCameras = videoDevices.filter(d =>
                    /back|rear|environment|traseira/i.test(d.label)
                );

                let mainCamera;
                if (backCameras.length >= 2) mainCamera = backCameras[1];
                else if (backCameras.length === 1) mainCamera = backCameras[0];
                else mainCamera = videoDevices.length > 0 ? videoDevices[0] : null;

                if (!mainCamera) throw new Error("Nenhuma câmera disponível.");

                const constraints = {
                    video: {
                        deviceId: { exact: mainCamera.deviceId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        advanced: [{ focusMode: "continuous" }],
                    },
                };

                await codeReader.decodeFromConstraints(constraints, "video", (result) => {
                    if (result) {
                        setEan(result.getText());
                        setLeitorAtivo(false);
                    }
                });
            } catch (err) {
                console.error(err);
                setErro("Erro ao acessar a câmera. Verifique permissões ou tente outra câmera.");
            }
        };

        initScanner();

        return () => {
            if (codeReaderRef.current) codeReaderRef.current.reset();
        };
    }, [leitorAtivo]);

    const handleAddProduto = () => {
        if (!ean || !nomeProduto || !valorProduto) {
            setErro("Preencha todos os campos!");
            setTimeout(() => setErro(""), 1500);
            return;
        }

        const novoProduto = {
            ean,
            nome: nomeProduto,
            valor: parseFloat(valorProduto),
        };

        setProdutosColetados([...produtosColetados, novoProduto]);
        setEan("");
        setNomeProduto("");
        setValorProduto("");
    };

    const handleEnviarMockAPI = async () => {
        try {
            // Verifica se a lista não está vazia antes de tentar enviar
            if (produtosColetados.length === 0) {
                 alert("A lista de produtos está vazia!");
                 return;
            }

            for (const produto of produtosColetados) {
                await fetch("https://68ed848edf2025af780067e3.mockapi.io/gestor/produtos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(produto),
                });
            }
            alert("Produtos enviados com sucesso!");
            setProdutosColetados([]);
        } catch (err) {
            console.error(err);
            setErro("Erro ao enviar para o MockAPI.");
        }
    };

    return (
        // O padding-top (pt-12) é para compensar um possível header fixo. 
        // Se o menu de hambúrguer está no header, ele é mais importante.
        <div className={`min-h-screen pt-12 p-6 relative flex flex-col ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
            {isMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
                    onClick={closeMenu}
                />
            )}

            {/* 1. Menu Lateral (SidebarMenu) */}
            <SidebarMenu
                menuItems={globalMenuOptions} // Lista FILTRADA
                accountInfo={userAccountInfo} // Infos da Conta (inclui isAdmin e onLogout)
                activeLink={currentPage} // Estado declarado
                onNavigate={handleNavigation}
                isMenuOpen={isMenuOpen} // Estado declarado
                onClose={closeMenu} 
            />
            
            {/* Header Mobile - Visível no mobile, tem o botão de menu */}
            <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 shadow-md md:hidden 
                bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <button 
                    onClick={toggleMenu} 
                    className={`p-2 rounded-lg text-2xl ${modoNoturno ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
                >
                    ☰
                </button>
                <h1 className="text-xl font-bold">Coletor EAN</h1>
                <div className="w-8"></div>
            </header>

            <div className="container mx-auto max-w-4xl pt-4 flex-grow"> 
                <h1 className="text-3xl font-bold text-center mb-6 hidden md:block">
                    Coletor de Produtos - Gestor
                </h1>

                {leitorAtivo && (
                    <div className="mb-4 relative w-full max-w-md mx-auto h-64 bg-black rounded-xl overflow-hidden shadow-2xl">
                        {/* Certifique-se de que a tag <video> está correta para ser acessada pelo ZXing */}
                        <video id="video" className="w-full h-full object-cover" autoPlay muted playsInline />
                        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500 transform -translate-y-1/2 pointer-events-none"></div>
                        <div className="absolute inset-0 border-4 border-green-500 opacity-60 pointer-events-none"></div>
                    </div>
                )}

                <div className="max-w-md mx-auto flex flex-col gap-3">
                    <input
                        type="text"
                        placeholder="EAN"
                        value={ean}
                        onChange={e => setEan(e.target.value)}
                        className="border p-3 rounded-lg text-gray-700 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                    <input
                        type="text"
                        placeholder="Nome do Produto"
                        value={nomeProduto}
                        onChange={e => setNomeProduto(e.target.value)}
                        className="border p-3 rounded-lg text-gray-700 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                    <input
                        type="number"
                        placeholder="Valor (R$)"
                        value={valorProduto}
                        onChange={e => setValorProduto(e.target.value)}
                        className="border p-3 rounded-lg text-gray-700 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />

                    <div className="flex gap-3">
                        <button
                            onClick={handleAddProduto}
                            className="flex-1 bg-blue-600 text-white font-semibold rounded-xl py-2 hover:bg-blue-700 transition"
                        >
                            Adicionar Produto
                        </button>
                        <button
                            onClick={() => setLeitorAtivo(!leitorAtivo)}
                            className={`flex-1 font-semibold rounded-xl py-2 transition ${
                                leitorAtivo ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                        >
                            {leitorAtivo ? "Parar Leitura" : "Ler Código"}
                        </button>
                    </div>
                </div>

                {erro && <p className="text-red-500 text-center mt-2">{erro}</p>}

                {produtosColetados.length > 0 && (
                    <div className="mt-6 max-w-md mx-auto bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-2">Produtos Coletados</h2>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {produtosColetados.map((p, i) => (
                                <li key={i} className="py-2 flex justify-between">
                                    <span>{p.nome}</span>
                                    <span className="font-semibold">R$ {p.valor.toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={handleEnviarMockAPI}
                            className="mt-4 w-full bg-purple-600 text-white font-semibold rounded-xl py-2 hover:bg-purple-700 transition"
                        >
                            Enviar para MockAPI
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GestorEAN;