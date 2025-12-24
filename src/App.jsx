import React, { useState, useEffect } from 'react';
import TelaInicial from './pages/TelaInicial';
import SomarValor from './pages/SomarValor';
import ValorDefinido from './pages/ValorDefinido';
import ValorMaximo from './pages/ValorMaximo';
import GestorEAN from './pages/GestorEAN';
import ListaPlan from './pages/ListaPlan'; // Importação da nova tela
import Login from './pages/Login';
import { ThemeProvider, useTheme } from './components/ThemeContext';

// Chaves para o localStorage
const USER_STORAGE_KEY = 'somarvalor_user_auth';
const LIST_STORAGE_KEY = 'somarvalor_lista_itens';

// MOCK DE USUÁRIOS
const MOCK_USERS = {
  'usuario': { role: 'usuario', email: 'usuario@app.com', name: 'Usuário Comum' },
  'admin': { role: 'admin', email: 'admin@app.com', name: 'Administrador' },
};

const AppContent = () => {
  // 1. ESTADO DE AUTENTICAÇÃO
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  // 2. ESTADO DA LISTA DE COMPRAS (Compartilhado entre as telas)
  const [items, setItems] = useState(() => {
    const savedItems = localStorage.getItem(LIST_STORAGE_KEY);
    try {
      return savedItems ? JSON.parse(savedItems) : [];
    } catch (e) {
      return [];
    }
  });

  // 3. ESTADO DE NAVEGAÇÃO
  const [option, setOption] = useState('');
  const [subOption, setSubOption] = useState('');

  // 4. TEMA (Modo Noturno)
  const { modoNoturno, toggleModoNoturno } = useTheme();

  // Efeito para persistir usuário
  useEffect(() => {
    if (usuarioLogado) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuarioLogado));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [usuarioLogado]);

  // Efeito para persistir a lista de compras
  useEffect(() => {
    localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // FUNÇÕES DE MANIPULAÇÃO
  const handleAutenticacaoSucesso = (role) => {
    const userObject = MOCK_USERS[role];
    if (userObject) setUsuarioLogado(userObject);
  };

  const handleSelectOption = (selectedOption, selectedSubOption) => {
    setOption(selectedOption);
    setSubOption(selectedSubOption);
  };

  const handleGoHome = () => {
    setOption('');
    setSubOption('');
  };

  const handleLogout = () => {
    setUsuarioLogado(null);
    handleGoHome();
  };

  // RENDERIZAÇÃO CONDICIONAL: LOGIN
  if (!usuarioLogado) {
    return (
      <div className={`h-dvh w-dvw transition-colors duration-500 ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
        <Login onAutenticacaoSucesso={handleAutenticacaoSucesso} />
      </div>
    );
  }

  // CONTEÚDO PRINCIPAL
  return (
    <div className={`h-dvh w-dvw relative transition-colors duration-500 ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      
      {/* TELA INICIAL */}
      {option === '' && (
        <TelaInicial 
          onSelectOption={handleSelectOption} 
          modoNoturno={modoNoturno} 
          onToggleModoNoturno={toggleModoNoturno}
          usuarioLogado={usuarioLogado}
          onLogoutSuccess={handleLogout}
        />
      )}

      {/* TELA: PLANEJAR LISTA */}
      {option === 'lista' && (
        <ListaPlan 
          items={items}
          setItems={setItems}
          onGoHome={handleGoHome}
          modoNoturno={modoNoturno} 
          usuarioLogado={usuarioLogado}
        />
      )}

      {/* TELA: SOMAR VALOR */}
      {option === 'somar' && (
        <SomarValor 
        onGoHome={handleGoHome}
        modoNoturno={modoNoturno} 
        onToggleModoNoturno={toggleModoNoturno}
        usuarioLogado={usuarioLogado}
        onLogoutSuccess={handleLogout}
        // Adicione ou verifique estas duas props:
        items={items} 
        setItems={setItems}
        />
      )}

      {/* TELA: ESTIPULAR VALOR (SUBTRAIR) */}
      {option === 'estipular' && subOption === 'subtrair' && (
        <ValorDefinido 
          onGoHome={handleGoHome} 
          modoNoturno={modoNoturno} 
          onToggleModoNoturno={toggleModoNoturno}
          usuarioLogado={usuarioLogado}
          onLogoutSuccess={handleLogout}
        />
      )}

      {/* TELA: ESTIPULAR VALOR (MÁXIMO) */}
      {option === 'estipular' && subOption === 'maximo' && (
        <ValorMaximo 
          onGoHome={handleGoHome}
          modoNoturno={modoNoturno} 
          onToggleModoNoturno={toggleModoNoturno}
          usuarioLogado={usuarioLogado}
          onLogoutSuccess={handleLogout}
        />
      )}

      {/* TELA: GESTOR EAN */}
      {option === 'gestor' && (
        <GestorEAN
          onGoHome={handleGoHome}
          modoNoturno={modoNoturno} 
          onToggleModoNoturno={toggleModoNoturno}
          usuarioLogado={usuarioLogado}
          onLogoutSuccess={handleLogout}
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