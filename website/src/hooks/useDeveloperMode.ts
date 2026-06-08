import { useState, useEffect, useCallback } from 'react';

export function useDeveloperMode() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleTerminal = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeTerminal = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we are inside an input field, textarea, or contenteditable element
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[role="textbox"]') ||
        target.closest('.chatbot') ||
        target.closest('.search-bar-container'); // Common class names that might contain search or chatbot logic

      if (isInput) return;

      // Ctrl + ` or Alt + T
      if (
        (event.ctrlKey && event.key === '`') ||
        (event.altKey && event.key.toLowerCase() === 't')
      ) {
        event.preventDefault();
        toggleTerminal();
      } else if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        closeTerminal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleTerminal, closeTerminal, isOpen]);

  return { isOpen, toggleTerminal, closeTerminal };
}
