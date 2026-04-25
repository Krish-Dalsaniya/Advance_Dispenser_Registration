import { Plus } from 'lucide-react';

export default function EmptyState({ 
  title = 'No records found', 
  description = 'There are no items to display at the moment. Try adding a new one.',
  actionLabel,
  onAction,
  icon: Icon
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-illustration">
        {Icon ? <Icon size={48} strokeWidth={1} /> : <div style={{ fontSize: 40, opacity: 0.2 }}>📁</div>}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          <Plus size={16} /> {actionLabel}
        </button>
      )}
    </div>
  );
}
