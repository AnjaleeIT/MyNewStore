import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext<any>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// මේක අනිවාර්යයෙන්ම තියෙන්න ඕනේ
export default ThemeProvider;

export const useTheme = () => useContext(ThemeContext);