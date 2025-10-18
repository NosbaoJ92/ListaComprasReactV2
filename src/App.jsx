import React, { useState } from 'react';
import TelaInicial from './pages/TelaInicial';
import SomarValor from './pages/SomarValor';
import ValorDefinido from './pages/ValorDefinido';
import ValorMaximo from './pages/ValorMaximo';
import GestorEAN from './pages/GestorEAN';
import Login from './pages/Login';
import { ThemeProvider, useTheme } from './components/ThemeContext';

// MOCK DE USUÁRIOS: Armazena o objeto completo para passar ao TelaInicial
const MOCK_USERS = {
  'usuario': { role: 'usuario', email: 'usuario@sistema.com', name: 'Usuário Comum' },
  'admin': { role: 'admin', email: 'admin@sistema.com', name: 'Administrador Chefe' },
};

const AppContent = () => {
  // 🔑 MUDANÇA 1: usuarioLogado armazena o OBJETO do usuário, não apenas a string 'role'
  // Ex: { role: 'admin', email: 'admin@sistema.com', name: 'Administrador Chefe' }
  const [usuarioLogado, setUsuarioLogado] = useState(null); 
  const [option, setOption] = useState('');
  const [subOption, setSubOption] = useState('');
  const { modoNoturno, toggleModoNoturno } = useTheme();

  // 🔑 MUDANÇA 2: Função agora usa a role para buscar o OBJETO completo
  const handleAutenticacaoSucesso = (role) => {
    const userObject = MOCK_USERS[role];
    if (userObject) {
      console.log('Usuário autenticado:', userObject);
      setUsuarioLogado(userObject); // Armazena o objeto completo
    } else {
      console.error('Role desconhecida:', role);
    }
  };

  const handleSelectOption = (selectedOption, selectedSubOption) => {
    setOption(selectedOption);
    setSubOption(selectedSubOption);
  };

  const handleGoHome = () => {
    setOption('');
    setSubOption('');
  };

  // Função de Logout: limpa o estado de autenticação
  const handleLogout = () => {
    setUsuarioLogado(null);
    setOption('');
    setSubOption('');
  };

  // ==============================================================
  // Renderização condicional: Login → Conteúdo principal
  // ==============================================================
  if (!usuarioLogado) {
    return (
      <div className={`h-dvh w-dvw transition-colors duration-500 ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
        <Login onAutenticacaoSucesso={handleAutenticacaoSucesso} />
      </div>
    );
  }

  // ==============================================================
  // Conteúdo principal após login
  // ==============================================================
  return (
    <div className={`h-dvh w-dvw relative transition-colors duration-500 ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      {option === '' && (
        <TelaInicial 
          onSelectOption={handleSelectOption} 
          modoNoturno={modoNoturno} 
          onToggleModoNoturno={toggleModoNoturno}
          
          // 🔑 MUDANÇA 3: Passa o objeto completo do usuário
          usuarioLogado={usuarioLogado}
          
          // 🔑 MUDANÇA 4: Passa a função de logout para o TelaInicial (que repassa ao menu)
          onLogoutSuccess={handleLogout}
        />
      )}

      {/* ... Outros componentes de rota permanecem inalterados ... */}
      {option === 'somar' && (
        <SomarValor 
          onGoHome={handleGoHome}
          modoNoturno={modoNoturno} 
          onToggleModoNoturno={toggleModoNoturno}
        />
      )}

      {option === 'estipular' && subOption === 'subtrair' && (
        <ValorDefinido 
          onGoHome={handleGoHome} 
          modoNoturno={modoNoturno} 
          onToggleModoNoturno={toggleModoNoturno}
        />
      )}

      {option === 'estipular' && subOption === 'maximo' && (
        <ValorMaximo 
          onGoHome={handleGoHome}
          modoNoturno={modoNoturno} 
          onToggleModoNoturno={toggleModoNoturno}
        />
      )}

      {option === 'gestor' && (
        <GestorEAN
          onGoHome={handleGoHome}
          modoNoturno={modoNoturno}
          onToggleModoNoturno={toggleModoNoturno}
        />
      )}
    </div>
  );
};

const App = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;