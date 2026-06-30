/**
 * EmptyState component
 * Props: icon, title, message, action: { label, onClick }
 */
export default function EmptyState({ icon = '📦', title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      {title && <h3>{title}</h3>}
      {message && <p>{message}</p>}
      {action && (
        <button className="btn-primary-custom" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
