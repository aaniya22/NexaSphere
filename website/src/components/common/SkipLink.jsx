import React from 'react';
import './SkipLink.css';

const SkipLink = ({ targetId = 'main-content', label = 'Skip to main content' }) => {
  return (
    <a href={`#${targetId}`} className="skip-link" aria-label={label}>
      {label}
    </a>
  );
};

export default SkipLink;
