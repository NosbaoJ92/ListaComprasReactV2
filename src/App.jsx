import React, { useState } from 'react';
import TelaInicial from './pages/TelaInicial';
import SomarValor from './pages/SomarValor';
import ValorDefinido from './pages/ValorDefinido';
import ValorMaximo from './pages/ValorMaximo';
import GestorEAN from './pages/GestorEAN';
import { ThemeProvider, useTheme } from './components/ThemeContext';

const AppContent = () => {
  const [option, setOption] = useState('');
  const [subOption, setSubOption] = useState('');
  const { modoNoturno, toggleModoNoturno } = useTheme();

  const handleSelectOption = (selectedOption, selectedSubOption) => {
    setOption(selectedOption);
    setSubOption(selectedSubOption);
  };

  const handleGoHome = () => {
    setOption('');
    setSubOption('');
  };

  return (
    <div className={`h-dvh w-dvw relative transition-colors duration-500 ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      
      {option === '' && (
        <TelaInicial 
          onSelectOption={handleSelectOption} 
          modoNoturno={modoNoturno} 
          onToggleModoNoturno={toggleModoNoturno}
        />
      )}

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

const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
