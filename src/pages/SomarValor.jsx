import { useState, useEffect, useRef } from "react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTheme } from '../components/ThemeContext'; 
import { BrowserMultiFormatReader } from "@zxing/library";
import SidebarMenu from '../components/SidebarMenu'; 

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
const SomarValor = ({ onGoHome, usuarioLogado, onLogoutSuccess, onToggleModoNoturno }) => {

 const isAdmin = usuarioLogado?.role === 'admin';
 const userEmail = usuarioLogado?.email || 'usuario@sistema.com';
 const userName = usuarioLogado?.name || (isAdmin ? "Admin" : "Usuário Comum");

	const { modoNoturno, toggleModoNoturno } = useTheme(); // Pega o tema do Contexto

	const [ean, setEan] = useState("");
	const [nomeProduto, setNomeProduto] = useState("");
	const [valorProduto, setValorProduto] = useState("");
	const [quantidadeProduto, setQuantidadeProduto] = useState("");
	const [erro, setErro] = useState("");
	const [editandoIndex, setEditandoIndex] = useState(null);
	const [produtos, setProdutos] = useState([]);
	const [isOpen, setIsOpen] = useState(false);
	const [produtoSelecionadoIndex, setProdutoSelecionadoIndex] = useState(null);

	const [currentPage, setCurrentPage] = useState('somar');
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	// Estados do Scanner
	const [leitorAtivo, setLeitorAtivo] = useState(false);
	const codeReaderRef = useRef(null);

	const closeMenu = () => setIsMenuOpen(false);
	const toggleMenu = () => setIsMenuOpen(prev => !prev);
	
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
		
		// Simulação de navegação para outras telas
		if (pageId === 'gestor') {
			if (!isAdmin) {
				alert("Acesso negado: Você não tem permissão de administrador.");
				return;
			}
			alert(`Navegação simulada para ${pageId}.`);
		} else if (pageId === 'settings') {
			alert(`Navegação simulada para ${pageId}.`);
		}
		 	
		setCurrentPage(pageId); 
	};
	
	// Estrutura de Opções base
	const baseMenuOptions = [
  { id: 'home', icon: '🏠', type: 'link', description: 'Voltar para a seleção de modo' },
  { id: 'gestor', icon: '📦', type: 'link', description: 'Gerenciar códigos de barras' },
  { id: 'settings', icon: '⚙️', type: 'link', description: 'Ajustes do sistema' },
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
		const produtosSalvos = localStorage.getItem("produtos");
		if (produtosSalvos) setProdutos(JSON.parse(produtosSalvos));
	}, []);

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

	// 🔹 Scanner
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

	const gerarPDF = () => {
		const doc = new jsPDF();
		doc.text("Relatório de gestão de compras", 10, 10);
		const tableColumn = ["EAN", "Nome", "Valor Unitário", "Quantidade", "Total"];
		const tableRows = produtos.map((p) => [
			p.ean || "-",
			p.nome,
			`R$ ${p.valor.toFixed(2)}`,
			p.quantidade,
			`R$ ${p.total.toFixed(2)}`
		]);

		doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
		const totalCompra = calcularTotalCompra().toFixed(2);
		const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 30; 
		doc.text(`Total da Compra: R$ ${totalCompra}`, 10, finalY + 10);
		doc.save('lista-produtos.pdf');
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
				menuItems={globalMenuOptions} // Lista FILTRADA
				accountInfo={userAccountInfo} // Infos da Conta (inclui isAdmin e onLogout)
				activeLink={currentPage}
				onNavigate={handleNavigation}
				isMenuOpen={isMenuOpen} 
				onClose={closeMenu} 
			/>


			{/* 2. Conteúdo Principal */}
			<main className="flex-grow p-4 sm:p-8 overflow-y-auto">
				 
				{/* Header/Barra para Mobile com Botão de Menu (Substitui os botões fixos de Home e Tema) */}
				<header className="flex items-center justify-between mb-8 md:hidden">
					<button 
						onClick={toggleMenu} 
						className={`p-2 rounded-lg text-2xl ${modoNoturno ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
					>
						☰
					</button>
					<h1 className="text-xl font-bold">Lista de Compras 🛒</h1>
					<div className="w-8"></div> {/* Placeholder para alinhar o título centralmente */}
				</header>

				{/* Conteúdo da tela SomarValor - ENGLOBA TODOS OS ELEMENTOS DA TELA PRINCIPAL */}
				<div className="container mx-auto max-w-4xl pt-8 md:pt-0 flex-grow">
					<h1 className="py-4 p-8 text-center text-4xl font-extrabold hidden md:block">Sua Lista de Compras 🛒</h1>

					{/* Lista de produtos */}
					<div className={`p-4 mt-4 rounded-xl shadow-lg border ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
						<div className="overflow-y-scroll min-h-44 max-h-96">
							{produtos.length === 0 ? (
								<div className="text-center py-10">
									<p className="font-semibold text-lg mb-2">Sua lista de compras está vazia. 📝</p>
									<p>Clique em <b>'+ Adicionar Produto'</b> para começar!</p>
								</div>
							) : (
								<div>
										{/* Títulos da Tabela (Desktop) */}
										<div className="hidden sm:flex w-full font-bold border-b-2 dark:border-gray-600">
											<div className={`px-4 py-3 text-left ${COL_NOME}`}>Nome</div>
											<div className={`px-4 py-3 text-right ${COL_VALOR}`}>Valor Und.</div>
											<div className={`px-4 py-3 text-center ${COL_QTD}`}>Qtd.</div>
											<div className={`px-4 py-3 text-right ${COL_TOTAL}`}>Total Item</div>
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
											{/* Desktop layout */}
											<div className="hidden sm:flex w-full">
												<div className={`px-4 py-3 text-left flex items-center ${COL_NOME}`}>{produto.nome}</div>
												<div className={`px-4 py-3 text-right flex items-center justify-end ${COL_VALOR}`}>R$ {produto.valor.toFixed(2)}</div>
												<div className={`px-4 py-3 text-center flex items-center justify-center ${COL_QTD}`}>{produto.quantidade}</div>
												<div className={`px-4 py-3 font-semibold text-right flex items-center justify-end ${COL_TOTAL} text-lg text-green-600 dark:text-green-400`}>R$ {produto.total.toFixed(2)}</div>
											</div>

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

					</div>

					{produtos.length > 0 && (
						<div className="border-t-4 border-green-500 font-bold p-4 text-right text-2xl text-green-600 dark:text-green-400">
							Total: R$ {calcularTotalCompra().toFixed(2)}
						</div>
					)}
					
					{/* BOTÕES DE CONTROLE - DENTRO DO CONTAINER PRINCIPAL */}
					<div className="flex justify-between items-center w-full mt-4">
						<button onClick={() => { setIsOpen(true); setEditandoIndex(null); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
							+ Adicionar Novo Produto
						</button>
						{/* <button onClick={gerarPDF} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-semibold">
							Gerar Relatório PDF
						</button> */}
					</div>
				 
				</div> {/* FECHAMENTO DO CONTAINER .mx-auto max-w-4xl */}

				{/* Modal (DEVE FICAR FORA DO CONTAINER DE CONTEÚDO PARA FUNCIONAR COMO OVERLAY) */}
				{isOpen && (
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
										<video id="video" className="w-full h-full object-cover" autoPlay autoFocus focusMode muted />
										
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
								placeholder="EAN do Produto"
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
									onClick={() => buscarProdutoPorEan(ean)}
									className={`flex-1 font-semibold rounded-xl py-2.5 shadow-sm transition-all active:scale-95 ${
										modoNoturno
											? 'bg-blue-500 text-white hover:bg-blue-600'
											: 'bg-blue-600 text-white hover:bg-blue-700'
									}`}
								>
									Buscar
								</button>

								<button
									onClick={() => setLeitorAtivo(!leitorAtivo)}
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
									onClick={() => {
										// Parar o leitor de forma segura antes de fechar o modal
										if (leitorAtivo) {
											if (codeReaderRef.current) codeReaderRef.current.reset();
											setLeitorAtivo(false);
										}
										setIsOpen(false);
										setErro("");
										setEditandoIndex(null);
										setEan("");
										setNomeProduto("");
										setValorProduto("");
										setQuantidadeProduto("");
									}}
									// O botão de cancelar só fica desativado se o leitor estiver realmente ativo e não tiver sido parado
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
			</main>
		</div>
	);
};

export default SomarValor;