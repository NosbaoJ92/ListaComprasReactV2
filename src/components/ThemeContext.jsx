// ThemeContext.js
import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [modoNoturno, setModoNoturno] = useState(false);

  const toggleModoNoturno = () => {
    setModoNoturno(!modoNoturno);
  };

  return (
    <ThemeContext.Provider value={{ modoNoturno, toggleModoNoturno }}>
      {children}
    </ThemeContext.Provider>
  );
};
