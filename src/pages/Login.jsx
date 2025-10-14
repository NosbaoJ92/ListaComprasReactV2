import React, { useState } from 'react';
import { useTheme } from '../components/ThemeContext'; // Assume que ThemeContext está em ../components/

// ----------------------------------------------------------------------
// MOCK DB: Usuários e Funções
// ----------------------------------------------------------------------
const MOCK_USERS = {
  // Usuário Padrão
  'usuario@app.com': { password: 'senha123', role: 'usuario' },
  // Usuário Administrador
  'admin@app.com': { password: 'admin123', role: 'admin' },
};
// ----------------------------------------------------------------------

/**
 * Componente de tela de Login e Cadastro.
 * @param {function} onAutenticacaoSucesso - Função chamada em caso de sucesso, recebe a função do usuário (role).
 */
const Login = ({ onAutenticacaoSucesso }) => {
  const [ehLogin, setEhLogin] = useState(true); // Alterna entre Login (true) e Cadastro (false)
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [estaCarregando, setEstaCarregando] = useState(false);
  
  // O erro de resolução ocorre aqui. Manter o caminho relativo é a prática padrão.
  const { modoNoturno, toggleModoNoturno } = useTheme();

  /**
   * Função para lidar com o envio do formulário de autenticação.
   */
  const lidarComEnvio = (e) => {
    e.preventDefault();
    setErro('');
    setEstaCarregando(true);

    setTimeout(() => {
      // 1. Validação básica
      if (email.trim() === '' || senha.trim() === '') {
        setErro('Por favor, preencha todos os campos.');
        setEstaCarregando(false);
        return;
      }

      if (!ehLogin) {
        // Lógica de Cadastro - Apenas simulação, adicionaria um novo usuário em um DB real
        if (senha !== confirmarSenha) {
          setErro('As senhas não coincidem.');
          setEstaCarregando(false);
          return;
        }
        
        // Simulação de cadastro: o novo usuário é sempre um 'usuario' padrão
        console.log('Simulando Cadastro para:', email);
        console.log(`Sucesso! Cadastro realizado para ${email}.`);
        onAutenticacaoSucesso('usuario');
        
      } else {
        // Lógica de Login
        const user = MOCK_USERS[email];
        
        if (user && user.password === senha) {
          // Login bem-sucedido
          console.log(`Login bem-sucedido. Função: ${user.role}`);
          // Chama a função de sucesso passando a função (role)
          onAutenticacaoSucesso(user.role); 
        } else {
          // Credenciais inválidas
          setErro('E-mail ou senha inválidos.');
        }
      }
      setEstaCarregando(false);
    }, 1000); // Simula um tempo de carregamento
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
    modoNoturno ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
  }`;

  return (
    <div className={classesBase}>
        {/* Botão de Toggle de Tema */}
        <button 
          onClick={toggleModoNoturno}
          className="absolute top-4 right-4 p-2 rounded-full transition duration-300 text-sm font-semibold"
        >
          {modoNoturno ? '☀️' : '🌙'}
        </button>

        <div className={classesCartao}>
            <h2 className="text-3xl font-extrabold text-center mb-6">
                {ehLogin ? 'Entrar' : 'Criar Conta'} 🛒
            </h2>
            
            <p className="text-center text-sm mb-4 opacity-70">
                Teste com: <br/>
                **Admin**: `admin@app.com` / `admin123`<br/>
                **Usuário**: `usuario@app.com` / `senha123`
            </p>

            <form onSubmit={lidarComEnvio}>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" htmlFor="email">E-mail</label>
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
                    <label className="block text-sm font-medium mb-1" htmlFor="senha">Senha</label>
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

                {!ehLogin && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-1" htmlFor="confirmarSenha">Confirme a Senha</label>
                        <input
                            type="password"
                            id="confirmarSenha"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            className={classesInput}
                            placeholder="Repita a senha"
                            required
                            disabled={estaCarregando}
                        />
                    </div>
                )}

                {erro && (
                    <p className="text-red-500 text-sm mb-4 text-center">{erro}</p>
                )}

                <button
                    type="submit"
                    className={classesBotaoPrincipal}
                    disabled={estaCarregando}
                >
                    {estaCarregando ? 'Carregando...' : (ehLogin ? 'Fazer Login' : 'Cadastrar')}
                </button>
            </form>

            <p className="mt-6 text-center text-sm">
                {ehLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                <button
                    onClick={() => {
                        setEhLogin(!ehLogin);
                        setErro(''); 
                        setEmail('');
                        setSenha('');
                        setConfirmarSenha('');
                    }}
                    className={`ml-1 font-semibold transition-colors duration-200 ${modoNoturno ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                    disabled={estaCarregando}
                >
                    {ehLogin ? 'Cadastre-se' : 'Fazer Login'}
                </button>
            </p>
        </div>
    </div>
  );
};

export default Login;
