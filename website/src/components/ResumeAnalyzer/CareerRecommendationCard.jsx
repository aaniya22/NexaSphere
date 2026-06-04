export default function CareerRecommendationCard({ recommendations }) {
  return (
    <div className="rec-grid">
      {recommendations.map((rec, i) => (
        <div key={i} className="rec-card">
          <div className="rec-header">
            <span className="rec-icon">{rec.icon}</span>
            <span className={`rec-badge badge-${rec.type}`}>{rec.type}</span>
          </div>
          <h4 className="rec-title">{rec.title}</h4>
          <p className="rec-desc">{rec.description}</p>
          {rec.link && (
            <a href={rec.link} target="_blank" rel="noreferrer" className="rec-link">
              Explore →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
