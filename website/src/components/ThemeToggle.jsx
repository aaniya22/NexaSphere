import { useEffect, useRef } from 'react';
import useTheme from '../hooks/useTheme';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    }
  }, [isDark]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-light-text dark:text-dark-text hidden sm:inline">
        {isDark ? 'Dark Mode' : 'Light Mode'}
      </span>
      <button
        ref={buttonRef}
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className="relative flex items-center justify-center w-12 h-12 rounded-full
                   bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600
                   hover:scale-110 active:scale-95 transition-all duration-300
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md"
      >
        <span
          className="text-xl transition-transform duration-500"
          style={{ transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)' }}
        >
          {isDark ? '??' : '??'}
        </span>
      </button>
    </div>
  );
};

export default ThemeToggle;
