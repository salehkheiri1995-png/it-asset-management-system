/**
 * KPI Stat Card
 * Props:
 *   icon, value, label, color ('orange'|'green'|'red'|'blue'|'purple')
 *   trend: { value: '+12%', direction: 'up'|'down' }  (optional)
 *   onClick (optional)
 */
export default function StatCard({ icon, value, label, color = 'orange', trend, onClick }) {
  return (
    <div
      className={`stat-card ${color}${onClick ? ' clickable-card' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="stat-top">
        <div className={`stat-icon ${color}`}>{icon}</div>
        {trend && (
          <span className={`stat-trend ${trend.direction}`}>{trend.value}</span>
        )}
      </div>
      <div className="stat-value">{value ?? <span className="skeleton skeleton-text" style={{height:'2rem',width:'4rem'}} />}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
