import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Customers from './pages/Customers';
import Components from './pages/Components';
import DispenserModels from './pages/DispenserModels';
import FirmwareVersions from './pages/FirmwareVersions';
import OTAUpdates from './pages/OTAUpdates';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Projects from './pages/Projects';
import Devices from './pages/Devices';
import SiteLocations from './pages/SiteLocations';
import SupportTickets from './pages/SupportTickets';
const pageTitles = {
  '/dashboard': 'Dashboard',
  '/users': 'Users & Roles',
  '/customers': 'Customers',
  '/components': 'Components',
  '/dispenser-models': 'Dispenser Models',
  '/firmware-versions': 'Firmware Builds',
  '/ota-updates': 'OTA Updates',
  '/products': 'Products',
  '/sales': 'Sales Orders',
  '/projects': 'Projects',
  '/devices': 'Device Registration',
  '/site-locations': 'Site Locations',
  '/support-tickets': 'Support Tickets',
};

function RoleProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user || !allowedRoles.includes(user.role_name)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const title = pageTitles[location.pathname] || 'Leons CRM';

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          title={title} 
        />
        <div className="page-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="/users" element={
              <RoleProtectedRoute allowedRoles={['Admin']}>
                <Users />
              </RoleProtectedRoute>
            } />
            
            <Route path="/customers" element={
              <RoleProtectedRoute allowedRoles={['Admin', 'Sales']}>
                <Customers />
              </RoleProtectedRoute>
            } />
            
            <Route path="/components" element={
              <RoleProtectedRoute allowedRoles={['Admin', 'Engineer']}>
                <Components />
              </RoleProtectedRoute>
            } />
            
            <Route path="/dispenser-models" element={
              <RoleProtectedRoute allowedRoles={['Admin', 'Engineer']}>
                <DispenserModels />
              </RoleProtectedRoute>
            } />
            
            <Route path="/firmware-versions" element={
              <RoleProtectedRoute allowedRoles={['Admin', 'Engineer']}>
                <FirmwareVersions />
              </RoleProtectedRoute>
            } />

            <Route path="/ota-updates" element={
              <RoleProtectedRoute allowedRoles={['Admin', 'Engineer']}>
                <OTAUpdates />
              </RoleProtectedRoute>
            } />

            <Route path="/products" element={
              <RoleProtectedRoute allowedRoles={['Admin', 'Engineer', 'Sales']}>
                <Products />
              </RoleProtectedRoute>
            } />
            
            <Route path="/sales" element={
              <RoleProtectedRoute allowedRoles={['Admin', 'Sales']}>
                <Sales />
              </RoleProtectedRoute>
            } />
            
            <Route path="/projects" element={
              <RoleProtectedRoute allowedRoles={['Admin', 'Sales', 'Technician']}>
                <Projects />
              </RoleProtectedRoute>
            } />
            
            <Route path="/devices" element={
              <RoleProtectedRoute allowedRoles={['Admin', 'Technician']}>
                <Devices />
              </RoleProtectedRoute>
            } />

            <Route path="/site-locations" element={
              <RoleProtectedRoute allowedRoles={['Admin', 'Sales']}>
                <SiteLocations />
              </RoleProtectedRoute>
            } />
            
            <Route path="/support-tickets" element={
              <RoleProtectedRoute allowedRoles={['Admin', 'Sales', 'Technician', 'Engineer']}>
                <SupportTickets />
              </RoleProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function LoginGuard({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginGuard><Login /></LoginGuard>} />
          <Route path="/register" element={<LoginGuard><Register /></LoginGuard>} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
