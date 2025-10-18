import React, { useState, useEffect } from 'react';
import TelaInicial from './pages/TelaInicial';
import SomarValor from './pages/SomarValor';
import ValorDefinido from './pages/ValorDefinido';
import ValorMaximo from './pages/ValorMaximo';
import GestorEAN from './pages/GestorEAN';
import Login from './pages/Login';
import { ThemeProvider, useTheme } from './components/ThemeContext';

// Chave para armazenar o objeto de usuário no localStorage
const USER_STORAGE_KEY = 'somarvalor_user_auth';

// MOCK DE USUÁRIOS: Armazena o objeto completo para passar aos componentes
const MOCK_USERS = {
'usuario': { role: 'usuario', email: 'usuario@app.com', name: 'Usuário Comum' },
'admin': { role: 'admin', email: 'admin@app.com', name: 'Administrador' },
};

const AppContent = () => {
// 🔑 AJUSTE 1: Inicializa o estado lendo do localStorage, se houver.
const [usuarioLogado, setUsuarioLogado] = useState(() => {
 const savedUser = localStorage.getItem(USER_STORAGE_KEY);
 try {
  return savedUser ? JSON.parse(savedUser) : null;
 } catch (e) {
  console.error("Erro ao parsear usuário do localStorage:", e);
  return null;
 }
});

const [option, setOption] = useState('');
const [subOption, setSubOption] = useState('');
const { modoNoturno, toggleModoNoturno } = useTheme();

// 🔑 AJUSTE 2: Efeito para PERSISTIR o estado de login no localStorage.
useEffect(() => {
 if (usuarioLogado) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuarioLogado));
 } else {
  localStorage.removeItem(USER_STORAGE_KEY);
 }
}, [usuarioLogado]);


const handleAutenticacaoSucesso = (role) => {
 const userObject = MOCK_USERS[role];
 if (userObject) {
  console.log('Usuário autenticado:', userObject);
  setUsuarioLogado(userObject); // O useEffect se encarrega de salvar no localStorage
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

// Função de Logout: limpa o estado de autenticação e o localStorage
const handleLogout = () => {
 setUsuarioLogado(null); // O useEffect remove do localStorage
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
    
    // Passa o objeto completo do usuário
    usuarioLogado={usuarioLogado}
    
    // Passa a função de logout
    onLogoutSuccess={handleLogout}
   />
  )}

  {/* 🔑 AJUSTE 3: Passa as props de login/logout para o SomarValor */}
  {option === 'somar' && (
   <SomarValor 
    onGoHome={handleGoHome}
    modoNoturno={modoNoturno} 
    onToggleModoNoturno={toggleModoNoturno}
    usuarioLogado={usuarioLogado} // <-- NOVO: Informação de quem está logado
    onLogoutSuccess={handleLogout} // <-- NOVO: Função para deslogar
   />
  )}

  {/* 🔑 AJUSTE 4: Repassar as props de usuário/logout para os demais componentes internos que as utilizam */}
  {option === 'estipular' && subOption === 'subtrair' && (
   <ValorDefinido 
    onGoHome={handleGoHome} 
    modoNoturno={modoNoturno} 
    onToggleModoNoturno={toggleModoNoturno}
    usuarioLogado={usuarioLogado} // <-- Recomendado
    onLogoutSuccess={handleLogout} // <-- Recomendado
   />
  )}

  {option === 'estipular' && subOption === 'maximo' && (
   <ValorMaximo 
    onGoHome={handleGoHome}
    modoNoturno={modoNoturno} 
    onToggleModoNoturno={toggleModoNoturno}
    usuarioLogado={usuarioLogado} // <-- Recomendado
    onLogoutSuccess={handleLogout} // <-- Recomendado
   />
  )}

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