import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, footer, width, error }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={width ? { width } : {}}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {error && (
            <div style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid #ef4444', 
              color: '#ef4444', 
              padding: '10px', 
              borderRadius: '6px', 
              marginBottom: '16px',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}
          {children}
        </div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
