import React from 'react';
import { useTheme } from '../components/ThemeContext';

const TelaInicial = ({ onSelectOption }) => {
  const [option, setOption] = React.useState('');
  const [subOption, setSubOption] = React.useState('');
  const { modoNoturno, toggleModoNoturno } = useTheme();

  const handleMainOptionChange = (e) => {
    setOption(e.target.value);
    setSubOption(''); // Limpa subopção ao mudar a opção principal
  };

  const handleSubOptionChange = (e) => {
    setSubOption(e.target.value);
  };

  const handleConfirm = () => {
    if (option === 'estipular' && !subOption) {
      alert('Por favor, selecione uma subopção para "Estipular valor".');
      return;
    }
    onSelectOption(option, subOption);
  };

  const cardClasses = (currentOption) => {
    const isSelected = option === currentOption;
    const baseClasses = 'p-6 rounded-xl shadow-lg transition duration-300 ease-in-out border-2';

    if (modoNoturno) {
      return isSelected
        ? `${baseClasses} border-blue-500 bg-gray-700`
        : `${baseClasses} border-gray-700 bg-gray-800 hover:bg-gray-700`;
    } else {
      return isSelected
        ? `${baseClasses} border-blue-500 bg-white ring-2 ring-blue-500`
        : `${baseClasses} border-gray-200 bg-white hover:bg-gray-50`;
    }
  };

  const subOptionClasses = (currentSubOption) => {
    const isSelected = subOption === currentSubOption;
    const baseClasses = 'flex items-center p-3 rounded-lg transition duration-200 ease-in-out cursor-pointer';

    if (modoNoturno) {
      return isSelected
        ? `${baseClasses} bg-blue-600 text-white`
        : `${baseClasses} bg-gray-700 hover:bg-gray-600 text-gray-100`;
    } else {
      return isSelected
        ? `${baseClasses} bg-blue-500 text-white`
        : `${baseClasses} bg-gray-200 hover:bg-gray-300 text-gray-800`;
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center p-4 sm:p-8 relative ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>

      {/* Botão de Toggle de Tema */}
      <button 
        onClick={toggleModoNoturno}
        className="absolute top-4 right-4 p-2 rounded-full transition duration-300 text-sm font-semibold"
      >
        {modoNoturno ? '☀️' : '🌙'}
      </button>

      <div className="w-full max-w-xl mt-16">
        <h1 className="text-3xl font-extrabold text-center mb-10">
          Bem-vindo à Lista de Compras - Online
        </h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          
          {/* Opção: Somar valores */}
          <label className={cardClasses('somar')}>
            <input
              type="radio"
              value="somar"
              checked={option === 'somar'}
              onChange={handleMainOptionChange}
              className="hidden"
            />
            <div className="flex flex-col items-center cursor-pointer">
              <span className="w-8 h-8 mb-2 flex items-center justify-center text-blue-500 font-bold text-2xl">∑</span>
              <p className="font-semibold text-xl">Somar Valores</p>
              <p className="text-center text-sm mt-1 opacity-75">
                Acompanhe o total gasto em tempo real.
              </p>
            </div>
          </label>

          {/* Opção: Estipular valor */}
          <label className={cardClasses('estipular')}>
            <input
              type="radio"
              value="estipular"
              checked={option === 'estipular'}
              onChange={handleMainOptionChange}
              className="hidden"
            />
            <div className="flex flex-col items-center cursor-pointer">
              <span className="w-8 h-8 mb-2 flex items-center justify-center text-blue-500 font-bold text-2xl">$</span>
              <p className="font-semibold text-xl">Estipular Valor</p>
              <p className="text-center text-sm mt-1 opacity-75">
                Defina um limite de orçamento ou um valor inicial.
              </p>
            </div>
          </label>
        </div>

        {/* Subopções */}
        {option === 'estipular' && (
          <div className="p-6 rounded-xl shadow-inner mb-8">
            <h3 className="font-bold text-lg mb-4 text-center">Selecione o tipo de Estipulação:</h3>
            <div className="flex flex-col space-y-3">
              <label className={subOptionClasses('subtrair')}>
                <input
                  type="radio"
                  value="subtrair"
                  checked={subOption === 'subtrair'}
                  onChange={handleSubOptionChange}
                  className="mr-3 transform scale-125"
                />
                Subtrair de um valor pré-definido
              </label>
              <label className={subOptionClasses('maximo')}>
                <input
                  type="radio"
                  value="maximo"
                  checked={subOption === 'maximo'}
                  onChange={handleSubOptionChange}
                  className="mr-3 transform scale-125"
                />
                Estipular valor máximo de gasto
              </label>
            </div>
          </div>
        )}

        {/* Botão Confirmar */}
        <button
          onClick={handleConfirm}
          disabled={!option || (option === 'estipular' && !subOption)}
          className={`w-full py-4 text-xl font-bold rounded-lg transition duration-300 ease-in-out 
            ${option || (option === 'estipular' && subOption)
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
              : 'bg-gray-400 text-gray-700 cursor-not-allowed'
            }`}
        >
          Confirmar
        </button>
        {option === 'estipular' && !subOption && (
          <p className="text-red-500 text-center mt-3 text-sm">
            *Selecione uma subopção para continuar.
          </p>
        )}
      </div>

      {/* Botão discreto do GestorEAN */}
      <button
        onClick={() => onSelectOption('gestor', '')}
        className="fixed bottom-4 right-4 p-2 text-xs rounded-lg bg-gray-500 text-white hover:bg-gray-600 shadow-md transition-opacity opacity-60 hover:opacity-100 z-50"
        title="Acesso ao Gestor de EAN"
      >
        Gestor EAN
      </button>
    </div>
  );
};

export default TelaInicial;
