import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import {
  Building2, Box, ShoppingCart, Router, FolderKanban,
  Users, Cpu, Clock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ComposedChart
} from 'recharts';

export default function Dashboard() {
  const { apiFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back! Here's an overview of your system.</p>
          </div>
        </div>
        <div className="stats-grid">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="stat-card">
              <div className="loading-skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
              <div style={{ flex: 1 }}>
                <div className="loading-skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                <div className="loading-skeleton" style={{ height: 28, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const s = stats?.summary || {};

  const chartData = stats?.monthly_sales?.map(m => ({
    month: m.month,
    orders: parseInt(m.order_count),
    revenue: parseFloat(m.revenue) / 1000,
  })) || [];

  const inventoryItems = stats?.component_inventory
    ? Object.entries(stats.component_inventory).map(([name, count]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        count,
      }))
    : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's an overview of your system.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatsCard label="Total Customers" value={s.total_customers} icon={Building2} color="blue" />
        <StatsCard label="Products" value={s.total_products} icon={Box} color="emerald" />
        <StatsCard label="Sales Orders" value={s.total_sales_orders} icon={ShoppingCart} color="amber" />
        <StatsCard label="Registered Devices" value={s.total_devices} icon={Router} color="purple" />
        <StatsCard label="Active Projects" value={s.active_projects} icon={FolderKanban} color="cyan" />
        <StatsCard label="Pending Orders" value={s.pending_orders} icon={Clock} color="rose" />
      </div>

      <div className="dashboard-grid">
        {/* Revenue Performance Chart */}
        <div className="card animate-in full-width">
          <div className="card-header">
            <div>
              <h3 className="card-title">Revenue Performance</h3>
              <p className="card-subtitle">Monthly revenue trends (₹K)</p>
            </div>
          </div>
          <div className="chart-container" style={{ height: 300 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1f35',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      color: '#f1f5f9',
                      fontSize: 13,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    fill="url(#colorRevenue)" 
                    strokeWidth={3} 
                    name="Revenue (₹K)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No revenue data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Volume Chart */}
        <div className="card animate-in">
          <div className="card-header">
            <div>
              <h3 className="card-title">Order Volume</h3>
              <p className="card-subtitle">Monthly transaction frequency</p>
            </div>
          </div>
          <div className="chart-container" style={{ height: 280 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1f35',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      color: '#f1f5f9',
                      fontSize: 13,
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar 
                    dataKey="orders" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]} 
                    barSize={30} 
                    name="Orders" 
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No order data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Component Inventory */}
        <div className="card animate-in">
          <div className="card-header">
            <div>
              <h3 className="card-title">Component Inventory</h3>
              <p className="card-subtitle">Available components in stock</p>
            </div>
          </div>
          <div className="inventory-list">
            {inventoryItems.map((item) => (
              <div key={item.name} className="inventory-item">
                <span className="item-name">{item.name}</span>
                <span className="item-count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Devices */}
        <div className="card animate-in full-width">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Device Registrations</h3>
              <p className="card-subtitle">Latest field installations</p>
            </div>
          </div>
          <div className="recent-list">
            {(stats?.recent_devices || []).map((dev) => (
              <div key={dev.device_id} className="recent-item">
                <div className="item-info">
                  <span className="item-title">{dev.serial_number} — {dev.model_name}</span>
                  <span className="item-sub">{dev.customer_name} | UID: {dev.device_uid}</span>
                </div>
                <span className="item-date">
                  {dev.installation_date ? new Date(dev.installation_date).toLocaleDateString('en-IN') : '—'}
                </span>
              </div>
            ))}
            {(!stats?.recent_devices || stats.recent_devices.length === 0) && (
              <div className="empty-state"><p>No recent registrations</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
