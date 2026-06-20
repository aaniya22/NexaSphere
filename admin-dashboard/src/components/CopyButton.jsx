import { useState } from 'react';
import { AdminIcon } from './AdminIcon';

export function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <button type="button" onClick={handleCopy} className="copy-btn" aria-label={`Copy ${label}`}>
      <AdminIcon name={copied ? 'Check' : 'Copy'} size={14} aria-hidden="true" />

      {copied ? 'Copied!' : label}
    </button>
  );
}
