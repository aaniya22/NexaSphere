import React, { useState, useRef, useEffect, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseCommand, CommandContext } from '../../utils/terminalCommands';

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  setTheme: (theme: string) => void;
  onNavigate: (page: string) => void;
}

interface OutputLine {
  id: number;
  text: string | React.ReactNode;
  type: 'input' | 'output' | 'error' | 'system';
}

export default function Terminal({ isOpen, onClose, theme, setTheme, onNavigate }: TerminalProps) {
  const [history, setHistory] = useState<OutputLine[]>([
    { id: 0, text: 'NexaSphere Developer Mode Terminal v1.0.0', type: 'system' },
    { id: 1, text: 'Type "help" for a list of available commands.', type: 'system' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [inputHistory, setInputHistory] = useState<string[]>([]);

  const endOfOutputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest output
  useEffect(() => {
    if (endOfOutputRef.current) {
      endOfOutputRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

  // Focus input when terminal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  const printToTerminal = (
    output: string | React.ReactNode,
    type: 'output' | 'error' | 'system' = 'output'
  ) => {
    setHistory((prev) => [...prev, { id: Date.now(), text: output, type }]);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const command = inputValue.trim();

      if (command) {
        setHistory((prev) => [...prev, { id: Date.now(), text: `> ${command}`, type: 'input' }]);
        setInputHistory((prev) => [...prev, command]);
        setHistoryIndex(-1);

        if (command.toLowerCase() === 'clear') {
          setHistory([]);
        } else {
          const context: CommandContext = {
            theme,
            setTheme,
            navigate: onNavigate,
            closeTerminal: onClose,
            printToTerminal,
          };
          parseCommand(command, context);
        }
      }
      setInputValue('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (inputHistory.length > 0) {
        const nextIndex = historyIndex < inputHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIndex);
        setInputValue(inputHistory[inputHistory.length - 1 - nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputValue(inputHistory[inputHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 99999, // Super high z-index to stay above everything
            padding: '1.5rem',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              width: '100%',
              maxWidth: '800px',
              margin: '0 auto',
              height: '400px',
              maxHeight: '60vh',
              background: theme === 'dark' ? 'rgba(10, 10, 10, 0.85)' : 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${theme === 'dark' ? 'rgba(204, 17, 17, 0.4)' : 'rgba(204, 17, 17, 0.2)'}`,
              borderRadius: '12px',
              boxShadow:
                theme === 'dark'
                  ? '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(204, 17, 17, 0.2) inset'
                  : '0 10px 40px rgba(0, 0, 0, 0.1), 0 0 20px rgba(204, 17, 17, 0.1) inset',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: "'Fira Code', 'Consolas', monospace",
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Terminal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(240, 240, 240, 0.6)',
                borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#ff5f56',
                  }}
                />
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#ffbd2e',
                  }}
                />
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#27c93f',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: theme === 'dark' ? '#888' : '#666',
                  fontWeight: 600,
                  letterSpacing: '1px',
                }}
              >
                NEXA_TERMINAL
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme === 'dark' ? '#888' : '#666',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
                aria-label="Close Terminal"
              >
                ✕
              </button>
            </div>

            {/* Terminal Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '0.9rem',
                color: theme === 'dark' ? '#eee' : '#222',
              }}
            >
              {history.map((line) => (
                <div
                  key={line.id}
                  style={{
                    color:
                      line.type === 'input'
                        ? theme === 'dark'
                          ? '#ff4444'
                          : '#cc1111'
                        : line.type === 'system'
                          ? theme === 'dark'
                            ? '#888'
                            : '#666'
                          : 'inherit',
                    wordBreak: 'break-all',
                  }}
                >
                  {line.text}
                </div>
              ))}
              <div ref={endOfOutputRef} />
            </div>

            {/* Terminal Input Form */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderTop: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                background: theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.4)',
              }}
            >
              <span
                style={{
                  color: theme === 'dark' ? '#ff4444' : '#cc1111',
                  marginRight: '0.5rem',
                  fontWeight: 'bold',
                }}
              >
                $
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: theme === 'dark' ? '#fff' : '#000',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                }}
                autoComplete="off"
                spellCheck="false"
                autoFocus
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
