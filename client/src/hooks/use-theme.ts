import { useEffect, useState } from 'react';
import { useTheme } from '@/components/ui/theme-provider';

export function useLocalTheme() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, ensure theme is synchronized with system/stored preference
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle theme between light and dark
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return {
    theme: mounted ? theme : 'dark', // Default to dark to prevent flash
    toggleTheme,
    mounted,
  };
}
