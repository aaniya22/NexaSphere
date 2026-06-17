import pino from 'pino';

// In a Vite browser bundle, import.meta.env is the correct way to read
// environment variables. typeof process guards are a Node.js/CJS pattern
// and are unnecessary here — Vite replaces import.meta.env at build time.
const isProduction = import.meta.env.MODE === 'production';
const isNode = typeof window === 'undefined';

export const logger = pino({
  level: import.meta.env.VITE_LOG_LEVEL ?? 'info',
  ...(isProduction || !isNode
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      }),
});

export default logger;
