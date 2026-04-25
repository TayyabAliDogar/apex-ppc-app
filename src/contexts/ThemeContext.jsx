import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Initialize theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('apex-ppc-theme');
    return savedTheme || 'dark';
  });

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;

    // Remove both classes first
    root.classList.remove('light-theme', 'dark-theme');

    // Add the current theme class
    root.classList.add(`${theme}-theme`);

    // Save to localStorage
    localStorage.setItem('apex-ppc-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
