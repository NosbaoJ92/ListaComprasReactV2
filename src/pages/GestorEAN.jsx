import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useTheme } from '../components/ThemeContext'; // Contexto de tema

const GestorEAN = ({ onGoHome }) => {
  const [ean, setEan] = useState("");
  const [nomeProduto, setNomeProduto] = useState("");
  const [valorProduto, setValorProduto] = useState("");
  const [leitorAtivo, setLeitorAtivo] = useState(false);
  const [produtosColetados, setProdutosColetados] = useState([]);
  const [erro, setErro] = useState("");
  const codeReaderRef = useRef(null);

  // 🔹 Tema via contexto
  const { modoNoturno, toggleModoNoturno } = useTheme();

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
    <div className={`min-h-screen pt-12 p-6 relative flex flex-col ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      
      {/* Botão Home */}
      <button
        onClick={onGoHome}
        className="fixed top-4 left-4 z-50 p-3 rounded-full shadow-lg transition duration-300 bg-white text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
      >
        🏠
      </button>

      {/* Botão Modo Noturno */}
      <button
        onClick={toggleModoNoturno}
        className="fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition duration-300 bg-white text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
      >
        {modoNoturno ? '☀️' : '🌙'}
      </button>

      <div className="container mx-auto max-w-4xl pt-8 flex-grow">
        <h1 className="text-3xl font-bold text-center mb-6">
          Coletor de Produtos - Gestor
        </h1>

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
