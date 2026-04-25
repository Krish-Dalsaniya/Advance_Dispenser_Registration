import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import {
  Building2, Box, ShoppingCart, Router, FolderKanban,
  Clock, CheckCircle2, ChevronRight, AlertCircle, Circle, Shield
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ComposedChart, Line, ReferenceLine, Cell, LabelList
} from 'recharts';

export default function Dashboard() {
  const { apiFetch, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6M');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await apiFetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="stats-grid">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="stat-card" style={{ height: 140 }}>
            <div className="loading-skeleton" style={{ height: '100%' }} />
          </div>
        ))}
      </div>
    );
  }

  const s = stats?.summary || {};
  const isEmpty = (s.total_customers || 0) === 0 && (s.total_devices || 0) === 0;

  const chartData = stats?.monthly_sales?.map((m, idx) => ({
    month: m.month,
    orders: parseInt(m.order_count),
    revenue: parseFloat(m.revenue) / 1000,
    priorRevenue: (parseFloat(m.revenue) / 1000) * 0.85, // Mock prior period
    target: 50, // Mock target
    momChange: idx > 0 ? Math.round(((parseInt(m.order_count) - parseInt(stats.monthly_sales[idx-1].order_count)) / parseInt(stats.monthly_sales[idx-1].order_count)) * 100) : 0
  })) || [];

  const inventoryItems = stats?.component_inventory
    ? Object.entries(stats.component_inventory).map(([name, count]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        count,
      })).slice(0, 5)
    : [];

  const userInitials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="dashboard-container">
      <div className="dashboard-welcome">
        <div className="welcome-avatar">
          {userInitials || <Circle size={24} />}
        </div>
        <div className="welcome-text">
          <h1>{getGreeting()}, {user?.first_name || 'Guest'}</h1>
          <div className="welcome-meta">
            <div className="meta-item">
              <Shield size={14} />
              <span>{user?.role_name || 'User'}</span>
            </div>
            <div className="meta-dot"></div>
            <div className="meta-item">
              <Building2 size={14} />
              <span>{user?.department || 'Main HQ'}</span>
            </div>
            <div className="meta-dot"></div>
            <div className="meta-item">
              <Clock size={14} />
              <span>Last login: {user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'Today'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatsCard label="Total Customers" value={s.total_customers} icon={Building2} trend={12} path="/customers" />
        <StatsCard label="Products" value={s.total_products} icon={Box} trend={5} path="/products" />
        <StatsCard label="Registered Devices" value={s.total_devices} icon={Router} trend={8} path="/devices" />
        <StatsCard label="Sales Orders" value={s.total_sales_orders} icon={ShoppingCart} trend={-2} path="/sales" />
        <StatsCard label="Active Projects" value={s.active_projects} icon={FolderKanban} trend={0} path="/projects" />
        <StatsCard label="Pending Orders" value={s.pending_orders} icon={Clock} trend={15} path="/sales" />
      </div>

      <div className="dashboard-grid">
        {/* Revenue Performance Chart */}
        <div className="card full-width">
          <div className="card-header">
            <div>
              <h3 className="card-title">Revenue Performance</h3>
              <p className="card-subtitle">Actual vs Prior Period Performance</p>
            </div>
            <div className="chart-header-actions">
              {['3M', '6M', '1Y'].map(range => (
                <button 
                  key={range} 
                  className={`pill-btn ${timeRange === range ? 'active' : ''}`}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-container" style={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f4c81" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0f4c81" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: '₹K / month', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#9ca3af' } }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Target', position: 'right', fill: '#f59e0b', fontSize: 10 }} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0f4c81" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  name="Current Period"
                />
                <Line 
                  type="monotone" 
                  dataKey="priorRevenue" 
                  stroke="#93c5fd" 
                  strokeWidth={2} 
                  dot={false}
                  name="Prior Period"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Volume Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Order Volume</h3>
              <p className="card-subtitle">Monthly order frequency & MoM growth</p>
            </div>
          </div>
          <div className="chart-container" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#0f4c81" />
                  ))}
                  <LabelList 
                    dataKey="momChange" 
                    position="top" 
                    formatter={(val) => val !== 0 ? `${val > 0 ? '+' : ''}${val}%` : ''}
                    style={{ fontSize: 10, fill: '#6b7280', fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory & Registrations Side-by-Side */}
        <div className="dashboard-grid-inner">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Component Inventory</h3>
            </div>
            <div className="inventory-list">
              {inventoryItems.map((item) => (
                <div key={item.name} className="inventory-item" style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.count <= 1 && (
                        <div className="low-stock-warning">
                          <AlertCircle size={12} /> Low Stock
                        </div>
                      )}
                      <span style={{ fontSize: '13px', fontWeight: 600, color: item.count <= 1 ? '#e85d24' : '#1a1a2e' }}>{item.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/components" className="card-footer-link">View All Components</Link>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Device Registrations</h3>
            </div>
            <div className="registration-list">
              {(stats?.recent_devices || []).slice(0, 4).map((dev) => (
                <div key={dev.device_id} className="registration-row">
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{dev.model_name}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{dev.serial_number}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#374151' }}>{dev.customer_name}</div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${dev.status === 'online' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                      {dev.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                      {dev.installation_date ? new Date(dev.installation_date).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              ))}
              {(!stats?.recent_devices || stats.recent_devices.length === 0) && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No recent registrations</div>
              )}
            </div>
            <Link to="/devices" className="card-footer-link">View All Devices</Link>
          </div>
        </div>

        {/* Empty State / Get Started */}
        {isEmpty && (
          <div className="get-started-card">
            <h2 style={{ fontFamily: 'DM Serif Display', fontSize: '28px', marginBottom: '8px' }}>Welcome to LEONS' Integrations</h2>
            <p style={{ opacity: 0.8, fontSize: '14px' }}>Let's get your first device registered. Follow these steps to complete your setup.</p>
            
            <div className="steps-grid">
              <div className="step-item" onClick={() => navigate('/customers')}>
                <div className="step-info">
                  <h4>1. Add Customer</h4>
                  <p style={{ fontSize: '11px', opacity: 0.7 }}>Define your client entities</p>
                </div>
                <div className="step-check"><ChevronRight size={16} /></div>
              </div>
              <div className="step-item" onClick={() => navigate('/site-locations')}>
                <div className="step-info">
                  <h4>2. Add Site</h4>
                  <p style={{ fontSize: '11px', opacity: 0.7 }}>Map installation locations</p>
                </div>
                <div className="step-check"><ChevronRight size={16} /></div>
              </div>
              <div className="step-item" onClick={() => navigate('/devices')}>
                <div className="step-info">
                  <h4>3. Register Device</h4>
                  <p style={{ fontSize: '11px', opacity: 0.7 }}>Onboard hardware to field</p>
                </div>
                <div className="step-check"><ChevronRight size={16} /></div>
              </div>
              <div className="step-item" onClick={() => navigate('/firmware-versions')}>
                <div className="step-info">
                  <h4>4. Assign Firmware</h4>
                  <p style={{ fontSize: '11px', opacity: 0.7 }}>Push initial software build</p>
                </div>
                <div className="step-check"><ChevronRight size={16} /></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
