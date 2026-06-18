export default function NotFoundPage({ onGoHome }) {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 24px',
      }}
    >
      <div
        style={{
          fontFamily: "'Orbitron',monospace",
          fontSize: 'clamp(5rem,18vw,10rem)',
          fontWeight: 900,
          background: 'linear-gradient(135deg,#CC1111 0%,#EE2222 50%,#FF4444 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
          marginBottom: '16px',
        }}
      >
        404
      </div>
      <h2
        style={{
          fontFamily: "'Orbitron',monospace",
          fontSize: 'clamp(1rem,3vw,1.5rem)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: '12px',
        }}
      >
        Page Not Found
      </h2>
      <p
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: '1rem',
          maxWidth: '380px',
          lineHeight: 1.7,
          marginBottom: '32px',
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <button
        className="btn btn-primary"
        onClick={onGoHome}
        style={{
          cursor: 'pointer',
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-text-on-primary)',
        }}
      >
        ← Go Home
      </button>
    </div>
  );
}
