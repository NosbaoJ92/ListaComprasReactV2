import React, { useState } from 'react';
import { useTheme } from '../components/ThemeContext';

// ----------------------------------------------------------------------
// MOCK DB: Usuários e Funções
// ----------------------------------------------------------------------
const MOCK_USERS = {
  'usuario@app.com': { password: '123456', role: 'usuario' },
  'admin@app.com': { password: '123456', role: 'admin' },
};
// ----------------------------------------------------------------------

const Login = ({ onAutenticacaoSucesso }) => {
  const [ehLogin] = useState(true); // Cadastro desabilitado — sempre modo login
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [estaCarregando, setEstaCarregando] = useState(false);
  const { modoNoturno, toggleModoNoturno } = useTheme();

  const lidarComEnvio = (e) => {
    e.preventDefault();
    setErro('');
    setEstaCarregando(true);

    setTimeout(() => {
      if (email.trim() === '' || senha.trim() === '') {
        setErro('Por favor, preencha todos os campos.');
        setEstaCarregando(false);
        return;
      }

      const user = MOCK_USERS[email];
      if (user && user.password === senha) {
        console.log(`Login bem-sucedido. Função: ${user.role}`);
        onAutenticacaoSucesso(user.role);
      } else {
        setErro('E-mail ou senha inválidos.');
      }

      setEstaCarregando(false);
    }, 1000);
  };

  const classesBase = `min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
    modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'
  }`;

  const classesCartao = `w-full max-w-sm p-8 rounded-2xl shadow-2xl transition-all duration-500 ${
    modoNoturno ? 'bg-gray-800' : 'bg-white'
  }`;

  const classesBotaoPrincipal = `w-full py-3 mt-6 text-lg font-bold rounded-lg transition duration-300 ease-in-out ${
    estaCarregando ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
  }`;

  const classesInput = `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-150 ${
    modoNoturno
      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900'
  }`;

  return (
    <div className={classesBase}>
      {/* Toggle Tema */}
      <button
        onClick={toggleModoNoturno}
        className="absolute top-4 right-4 p-2 rounded-full transition duration-300 text-sm font-semibold"
      >
        {modoNoturno ? '☀️' : '🌙'}
      </button>

      <div className={classesCartao}>
        <h2 className="text-3xl font-extrabold text-center mb-6">Login 🛒</h2>

        <form onSubmit={lidarComEnvio}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={classesInput}
              placeholder="seu@email.com"
              required
              disabled={estaCarregando}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="senha">
              Senha
            </label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={classesInput}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              disabled={estaCarregando}
            />
          </div>

          {erro && (
            <p className="text-red-500 text-sm mb-4 text-center">{erro}</p>
          )}

          <button
            type="submit"
            className={classesBotaoPrincipal}
            disabled={estaCarregando}
          >
            {estaCarregando ? 'Carregando...' : 'Fazer Login'}
          </button>
        </form>

        {/* Rodapé com cadastro desativado */}
        <p className="mt-6 text-center text-sm opacity-70">
          Não tem uma conta?{' '}
          <span
            className={`ml-1 font-semibold ${
              modoNoturno ? 'text-gray-500' : 'text-gray-400'
            } cursor-not-allowed`}
            title="Cadastro temporariamente desativado"
          >
            Cadastre-se (indisponível)
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
