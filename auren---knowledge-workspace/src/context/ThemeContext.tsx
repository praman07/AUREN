import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auren_theme');
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        return saved;
      }
    }
    return 'light';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auren_theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateActualTheme = () => {
      const dark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      setIsDark(dark);
      if (dark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
        if (body) body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
        if (body) body.classList.remove('dark');
      }
    };

    updateActualTheme();
    try {
      localStorage.setItem('auren_theme', theme);
    } catch (e) {
      // ignore storage errors
    }

    const handler = () => {
      if (theme === 'system') updateActualTheme();
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(() => {
      // Toggle based on the current effective dark state
      return isDark ? 'light' : 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
