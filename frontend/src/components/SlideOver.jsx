import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function SlideOver({ isOpen, onClose, title, children, footer, width = '500px' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="slideover-overlay" onClick={onClose}>
      <div 
        className="slideover-panel" 
        style={{ width }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="slideover-header">
          <h2 className="slideover-title">{title}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close panel">
            <X size={20} />
          </button>
        </div>
        
        <div className="slideover-body">
          {children}
        </div>

        {footer && (
          <div className="slideover-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
