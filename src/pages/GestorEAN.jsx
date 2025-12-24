import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useTheme } from "../components/ThemeContext";
import SidebarMenu from "../components/SidebarMenu";

const GestorEAN = ({ onGoHome, usuarioLogado }) => {
  const [ean, setEan] = useState("");
  const [nomeProduto, setNomeProduto] = useState("");
  const [valorProduto, setValorProduto] = useState("");
  const [leitorAtivo, setLeitorAtivo] = useState(false);
  const [produtosColetados, setProdutosColetados] = useState([]);
  const [erro, setErro] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 🔹 novo estado do menu
  const codeReaderRef = useRef(null);

  const { modoNoturno } = useTheme();

  const isAdmin = usuarioLogado?.role === "admin";
  const userEmail = usuarioLogado?.email || "usuario@app.com";
  const userName = usuarioLogado?.name || (isAdmin ? "Admin Mestre" : "Usuário Comum");

  // --- Menu lateral dinâmico
  const menuItems = [
    { id: "home", icon: "🏠", type: "link", description: "Voltar para a seleção de modo" },
    { id: "gestor", icon: "📦", type: "link", description: "Gerenciar códigos de barras" },
    // { id: "settings", icon: "⚙️", type: "link", description: "Ajustes do sistema" },
    { id: "themeToggle", icon: "🌙", type: "toggleTheme", description: `Tema: ${modoNoturno ? "Escuro" : "Claro"}` },
  ];

  const accountInfo = {
    username: userName,
    email: userEmail,
    isAdmin,
    onLogout: onGoHome,
  };

  useEffect(() => {
    const produtosSalvos = localStorage.getItem("produtosColetados");
    if (produtosSalvos) setProdutosColetados(JSON.parse(produtosSalvos));
  }, []);

  useEffect(() => {
    localStorage.setItem("produtosColetados", JSON.stringify(produtosColetados));
  }, [produtosColetados]);

  useEffect(() => {
    if (!leitorAtivo) {
      if (codeReaderRef.current) codeReaderRef.current.reset();
      return;
    }

    const initScanner = async () => {
      try {
        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");

        const backCameras = videoDevices.filter((d) =>
          /back|rear|environment|traseira/i.test(d.label)
        );

        const mainCamera = backCameras[1] || backCameras[0] || videoDevices[0] || null;
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

    const novoProduto = { ean, nome: nomeProduto, valor: parseFloat(valorProduto) };
    setProdutosColetados([...produtosColetados, novoProduto]);
    setEan("");
    setNomeProduto("");
    setValorProduto("");
  };

  const handleEnviarMockAPI = async () => {
    try {
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

  if (!isAdmin) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        modoNoturno ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
      }`}>
        <p>Acesso negado.</p>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${modoNoturno ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
      {/* 🔹 Menu lateral */}
      <SidebarMenu
        menuItems={menuItems}
        accountInfo={accountInfo}
        activeLink="gestor"
        onNavigate={onGoHome}
        isMenuOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* 🔹 Conteúdo principal */}
      <div className="flex-1 p-6">
        {/* Header Mobile */}
        <header className="md:hidden flex items-center justify-between mb-6">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-lg text-2xl shadow ${modoNoturno ? "bg-gray-700 text-white" : "bg-white text-gray-800"}`}
          >
            ☰
          </button>
          <div className="w-8"></div>
        </header>

        <div className="w-full max-w-xl mx-auto">
          <h1 className="py-4 text-center text-4xl font-extrabold mb-10">Coletor de Produtos - Gestor EAN</h1>

          {leitorAtivo && (
            <div className="mb-4 relative w-full max-w-md mx-auto">
              <video id="video" className="w-full h-64 object-cover" autoPlay muted />
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500 transform -translate-y-1/2 pointer-events-none"></div>
              <div className="absolute inset-0 border-4 border-green-500 opacity-60 pointer-events-none"></div>
            </div>
          )}

          <div className="max-w-md mx-auto flex flex-col gap-3">
            <input
              type="text"
              placeholder="EAN"
              value={ean}
              onChange={(e) => setEan(e.target.value)}
              className="border p-3 rounded-lg text-gray-700 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
            <input
              type="text"
              placeholder="Nome do Produto"
              value={nomeProduto}
              onChange={(e) => setNomeProduto(e.target.value)}
              className="border p-3 rounded-lg text-gray-700 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
            <input
              type="number"
              placeholder="Valor (R$)"
              value={valorProduto}
              onChange={(e) => setValorProduto(e.target.value)}
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
    </div>
  );
};

export default GestorEAN;
