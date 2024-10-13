'use client';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

const DarkModeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
    </button>
  );
};

export default DarkModeToggle;
