import React from 'react';

const AccessibilityStatement = () => {
  return (
    <main
      id="main-content"
      className="accessibility-statement"
      style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}
    >
      <h1>Accessibility Statement for NexaSphere</h1>
      <p>
        NexaSphere is committed to ensuring digital accessibility for people with disabilities. We
        are continually improving the user experience for everyone and applying the relevant
        accessibility standards.
      </p>

      <h2>Conformance Status</h2>
      <p>
        The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and
        developers to improve accessibility for people with disabilities. NexaSphere is committed to
        achieving WCAG 2.1 level AA conformance.
      </p>

      <h2>Feedback</h2>
      <p>
        We welcome your feedback on the accessibility of NexaSphere. Please let us know if you
        encounter accessibility barriers:
      </p>
      <ul>
        <li>Email: accessibility@nexasphere.com</li>
      </ul>

      <h2>Technical Specifications</h2>
      <p>
        Accessibility of NexaSphere relies on the following technologies to work with the particular
        combination of web browser and any assistive technologies or plugins installed on your
        computer:
      </p>
      <ul>
        <li>HTML</li>
        <li>WAI-ARIA</li>
        <li>CSS</li>
        <li>JavaScript</li>
      </ul>

      <h2>Assessment Approach</h2>
      <p>NexaSphere assessed the accessibility of the platform by the following approaches:</p>
      <ul>
        <li>Self-evaluation</li>
        <li>Automated testing with axe-core</li>
        <li>Manual testing with screen readers (NVDA/VoiceOver)</li>
      </ul>

      <p>Last Updated: June 2026</p>
    </main>
  );
};

export default AccessibilityStatement;
