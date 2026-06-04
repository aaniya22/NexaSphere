export default function ATSScoreBar({ score, label }) {
  const getColor = () => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="score-bar-wrap">
      <div className="score-bar-header">
        <span className="score-label">{label}</span>
        <span className="score-value" style={{ color: getColor() }}>
          {score}%
        </span>
      </div>
      <div className="score-track">
        <div
          className="score-fill"
          style={{ width: `${score}%`, background: getColor(), transition: 'width 1s ease' }}
        />
      </div>
    </div>
  );
}
