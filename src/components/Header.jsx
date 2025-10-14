import React, { useState } from 'react';
import { useTheme } from './ThemeContext'; // Assumindo que você tem um contexto de tema
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';

const CustomSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase': {
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
    '&.Mui-checked': {
      color: theme.palette.mode === 'dark' ? '#fff' : '#000',
      '& .MuiSwitch-thumb': {
        transform: 'translateX(20px)',
        color: theme.palette.mode === 'dark' ? '#000' : '#fff',
      },
    },
  },
  '& .MuiSwitch-track': {
    backgroundColor: theme.palette.mode === 'dark' ? '#444' : '#ccc',
  },
}));

const Header = ({ titulo }) => {
  const { modoNoturno, toggleModoNoturno } = useTheme();
  const [menuAberto, setMenuAberto] = useState(false);

  const handleMenuToggle = () => {
    setMenuAberto(!menuAberto);
  };

  return (
    <header className={`flex items-center justify-between p-4 ${modoNoturno ? 'bg-gray-800 text-gray-100' : 'bg-gray-200 text-gray-900'}`}>
      <h1 className="text-xl font-bold">{titulo}</h1>
      <button onClick={handleMenuToggle} className="text-xl">
        ☰
      </button>

      {menuAberto && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center w-full">
          <div className={`fixed top-0 left-0 h-full w-full bg-${modoNoturno ? 'gray-900' : 'white'} text-${modoNoturno ? 'gray-100' : 'gray-900'} `}>
            <button
              onClick={handleMenuToggle}
              className="absolute top-4 right-4 text-2xl"
            >
              ×
            </button>
            <div className="flex flex-col h-full items-center justify-center">
              <div className="flex gap-2 items-center mb-4 border w-6/12 justify-center">
                <h2 className="text-lg font-bold">Modo Noturno</h2>
                <CustomSwitch
                  checked={modoNoturno}
                  onChange={toggleModoNoturno}
                  aria-label="Toggle Dark Mode"
                />
              </div>
              
              {/* Adicione mais itens de menu aqui */}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
