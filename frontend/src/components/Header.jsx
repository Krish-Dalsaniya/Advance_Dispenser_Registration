import { Search, Bell, LogOut, Sun, Moon, Menu, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Header({ collapsed, onToggle, title }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const initials = user
    ? `${(user.first_name || '')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase()
    : '??';

  return (
    <header className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="header-left">
        <button className="header-btn toggle-btn" onClick={onToggle} title="Toggle Sidebar">
          <Menu size={20} />
        </button>
        <h1 className="header-title">{title || 'Dashboard'}</h1>
      </div>

      <div className="header-right">
        <div className="header-search">
          <Search className="search-icon" size={16} />
          <input type="text" placeholder="Search anything..." />
          <span className="search-hint">⌘K</span>
        </div>

        <button 
          className="header-btn" 
          onClick={toggleTheme} 
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="header-btn" title="Notifications">
          <Bell size={18} />
          <span className="notification-dot"></span>
        </button>

        <div className="header-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <span className="user-name">
              {user?.first_name} {user?.last_name}
              <ChevronDown size={14} style={{ marginLeft: 4, opacity: 0.5 }} />
            </span>
            <span className="user-role">{user?.role_name}</span>
          </div>
        </div>

        <button className="header-btn" onClick={logout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
