import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Building2, Cpu, Box, ShoppingCart,
  FolderKanban, Router, ChevronLeft, ChevronRight, Fuel, Settings2,
  MapPin, LifeBuoy, LogOut, Settings, Layers, Zap
} from 'lucide-react';

const ALL_ROLES = ['Admin', 'Engineer', 'Sales', 'Technician'];

const navItems = [
  { section: 'Overview', roles: ALL_ROLES },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL_ROLES },
  
  { section: 'Management', roles: ['Admin', 'Sales', 'Engineer'] },
  { path: '/users', label: 'Users & Roles', icon: Users, roles: ['Admin'] },
  { path: '/customers', label: 'Customers', icon: Building2, roles: ['Admin', 'Sales'] },
  { path: '/site-locations', label: 'Site Locations', icon: MapPin, roles: ['Admin', 'Sales'] },
  { path: '/components', label: 'Components', icon: Cpu, roles: ['Admin', 'Engineer'] },
  { path: '/dispenser-models', label: 'Dispenser Models', icon: Fuel, roles: ['Admin', 'Engineer'] },
  { path: '/products', label: 'Products', icon: Box, roles: ['Admin', 'Engineer', 'Sales'] },
  
  { section: 'Firmware & OTA', roles: ['Admin', 'Engineer'] },
  { path: '/firmware-versions', label: 'Firmware Builds', icon: Layers, roles: ['Admin', 'Engineer'] },
  { path: '/ota-updates', label: 'OTA Updates', icon: Zap, roles: ['Admin', 'Engineer'] },
  
  { section: 'Operations', roles: ALL_ROLES },
  { path: '/sales', label: 'Sales Orders', icon: ShoppingCart, roles: ['Admin', 'Sales'] },
  { path: '/projects', label: 'Projects', icon: FolderKanban, roles: ['Admin', 'Sales', 'Technician'] },
  { path: '/devices', label: 'Device Registration', icon: Router, roles: ['Admin', 'Technician'] },
  { path: '/support-tickets', label: 'Support Tickets', icon: LifeBuoy, roles: ['Admin', 'Sales', 'Technician', 'Engineer'] },
];

import logo from '../assets/logo.png';

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { user } = useAuth();

  // Filter items based on user role
  const filteredItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role_name);
  });

  // Filter sections that have no children visible
  const finalItems = filteredItems.filter((item, idx) => {
    if (item.section) {
      const nextItem = filteredItems[idx + 1];
      return nextItem && !nextItem.section;
    }
    return true;
  });

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <img src={logo} alt="Leons CRM" className="logo-img" />
      </div>

      <nav className="sidebar-nav">
        {finalItems.map((item, idx) => {
          if (item.section) {
            return (
              <div key={idx} className="nav-section-title">
                {item.section}
              </div>
            );
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="nav-icon" size={18} />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="nav-item">
          <Settings className="nav-icon" size={18} />
          <span className="nav-label">Settings</span>
        </div>
        <div className="nav-item logout" onClick={() => {
          localStorage.removeItem('token');
          window.location.reload();
        }}>
          <LogOut className="nav-icon" size={18} />
          <span className="nav-label">Logout</span>
        </div>
      </div>
    </aside>
  );
}
