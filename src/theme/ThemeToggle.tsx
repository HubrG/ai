'use client';

import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSunBright, faMoon } from '@fortawesome/pro-solid-svg-icons';

export const ThemeToggle = () => {
  const { setTheme, theme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="lg"
      onClick={() => {
        setTheme(theme === 'light' ? 'dark' : 'light');
      }}
    >
      <FontAwesomeIcon icon={faSunBright} 
        size='lg'
        className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
      />

      <FontAwesomeIcon icon={faMoon}
        size='lg'
        className="absolute rotate-90 scale-0 transition-all dark:-rotate-0 dark:scale-100"
      />
      <span className="sr-only">Toggle Theme</span>
    </Button>
  );
};