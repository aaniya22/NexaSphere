export function Skeleton({ height = 48, width = '100%', count = 1 }) {
  const safeCount = Math.max(1, count || 1);
  return (
    <>
      {Array.from({ length: safeCount }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height, width, marginBottom: '8px' }} />
      ))}
    </>
  );
}
