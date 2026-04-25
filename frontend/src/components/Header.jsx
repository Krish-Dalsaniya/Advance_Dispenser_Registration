import { Menu } from 'lucide-react';

export default function Header({ collapsed, onToggle, title, action }) {
  return (
    <header className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="header-left">
        <button 
          className="btn-icon" 
          onClick={onToggle} 
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="header-title">{title || 'Dashboard'}</h1>
      </div>

      <div className="header-right">
        {action}
      </div>
    </header>
  );
}
