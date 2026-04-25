import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHeaderAction } from '../context/HeaderActionContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { 
  Plus, Search, MapPin, LayoutGrid, Map as MapIcon, 
  ExternalLink, Router, AlertCircle 
} from 'lucide-react';

export default function SiteLocationsPage() {
  const { apiFetch } = useAuth();
  const { setAction } = useHeaderAction();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ customer_id: '', site_name: '', address_line1: '', city: '', state: '', pincode: '' });
  const [editing, setEditing] = useState(null);
  
  // View & Filters
  const [viewMode, setViewMode] = useState('table'); // table or map
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');

  useEffect(() => { 
    load(); 
    loadCustomers(); 
    loadDevices();
  }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/site-locations');
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadCustomers = async () => {
    try {
      const res = await apiFetch('/api/customers');
      if (res.ok) setCustomers(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadDevices = async () => {
    try {
      const res = await apiFetch('/api/devices');
      if (res.ok) setDevices(await res.json());
    } catch (e) { console.error(e); }
  };

  const openCreate = useCallback(() => { 
    setForm({ customer_id: '', site_name: '', address_line1: '', address_line2: '', city: '', state: '', country: 'India', pincode: '' }); 
    setEditing(null); 
    setModal(true); 
  }, []);

  useEffect(() => {
    setAction(
      <button className="btn btn-primary" onClick={openCreate}>
        <Plus size={16} /> Add Site
      </button>
    );
    return () => setAction(null);
  }, [setAction, openCreate]);

  const openEdit = (row) => { setForm(row); setEditing(row.site_location_id); setModal(true); };

  const handleDelete = async (row) => {
    if (!confirm(`Delete site "${row.site_name}"?`)) return;
    await apiFetch(`/api/site-locations/${row.site_location_id}`, { method: 'DELETE' });
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editing ? `/api/site-locations/${editing}` : '/api/site-locations';
    await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
    setModal(false);
    load();
  };

  const onChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const filteredData = useMemo(() => {
    return data.filter(s => {
      const matchesSearch = !search || 
        s.site_name.toLowerCase().includes(search.toLowerCase()) ||
        s.address_line1.toLowerCase().includes(search.toLowerCase()) ||
        s.city.toLowerCase().includes(search.toLowerCase());
      
      const matchesCustomer = customerFilter === 'All' || s.customer_name === customerFilter;
      const matchesState = stateFilter === 'All' || s.state === stateFilter;
      
      return matchesSearch && matchesCustomer && matchesState;
    });
  }, [data, search, customerFilter, stateFilter]);

  const states = useMemo(() => ['All', ...new Set(data.map(s => s.state).filter(Boolean))], [data]);

  const columns = [
    { 
      key: 'customer_name', 
      label: 'Customer',
      render: (val, row) => (
        <button 
          className="badge" 
          style={{ cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f4c81', fontSize: '11px' }}
          onClick={(e) => { e.stopPropagation(); navigate(`/customers?id=${row.customer_id}`); }}
        >
          {val} <ExternalLink size={10} style={{ marginLeft: 4 }} />
        </button>
      )
    },
    { key: 'site_name', label: 'Site Name', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { 
      key: 'address_line1', 
      label: 'Address',
      render: (val, row) => (
        <div className="address-cell" title={`${val}, ${row.city}, ${row.state}`}>
          {val}
        </div>
      )
    },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { 
      key: 'pincode', 
      label: 'Pincode', 
      render: (val) => <span className="mono" style={{ display: 'block', textAlign: 'right' }}>{val}</span> 
    },
  ];

  if (data.length === 0) {
    const hasNoCustomers = customers.length === 0;
    return (
      <EmptyState 
        icon={MapPin}
        title="No site locations added"
        description="Sites link your customers to physical installation points for their dispensers"
        actionLabel={hasNoCustomers ? "Go to Customers" : "Add First Site"}
        onAction={hasNoCustomers ? () => navigate('/customers') : openCreate}
      >
        {hasNoCustomers && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e85d24', fontSize: '12px', background: '#fff7ed', padding: '12px', borderRadius: '8px' }}>
            <AlertCircle size={14} />
            <span>You need at least one customer before adding a site. <Link to="/customers" style={{ fontWeight: 600, textDecoration: 'underline' }}>Add Customer</Link></span>
          </div>
        )}
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Site Locations</h1>
          <p className="page-subtitle">Geographic distribution of your dispenser fleet</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-left">
          <div className="search-container">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by site name, address, or city…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-chips">
            <select className="filter-select" value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}>
              <option value="All">Customer: All</option>
              {customers.map(c => <option key={c.customer_id} value={c.customer_name}>{c.customer_name}</option>)}
            </select>
            <select className="filter-select" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
              {states.map(s => <option key={s} value={s}>{s === 'All' ? 'State: All' : s}</option>)}
            </select>
          </div>
          <div className="view-toggle">
            <button className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
              <LayoutGrid size={14} /> Table
            </button>
            <button className={`view-toggle-btn ${viewMode === 'map' ? 'active' : ''}`} onClick={() => setViewMode('map')}>
              <MapIcon size={14} /> Map
            </button>
          </div>
        </div>
        <div className="record-count">{filteredData.length} sites</div>
      </div>

      {viewMode === 'table' ? (
        <DataTable 
          columns={columns} 
          data={filteredData} 
          onEdit={openEdit} 
          onDelete={handleDelete}
          expandable
          rowIdKey="site_location_id"
          renderExpansion={(row) => {
            const siteDevices = devices.filter(d => d.site_location_id === row.site_location_id);
            return (
              <div className="sub-table-container">
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Router size={14} /> INSTALLED DEVICES ({siteDevices.length})
                </div>
                {siteDevices.length > 0 ? (
                  <table className="sub-table">
                    <thead>
                      <tr>
                        <th>Device ID</th>
                        <th>Model</th>
                        <th>Serial Number</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siteDevices.map(d => (
                        <tr key={d.device_id}>
                          <td className="mono">{d.device_uid.substring(0, 8)}</td>
                          <td>{d.model_name}</td>
                          <td>{d.serial_number}</td>
                          <td>
                            <span className={`badge ${d.status === 'online' ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: '10px' }}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div style={{ fontSize: '12px', color: '#94a3b8', padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>No devices installed at this site</div>}
              </div>
            );
          }}
        />
      ) : (
        <div className="map-view-container">
          <div className="map-placeholder-bg" />
          <div className="map-pins-layer">
            {filteredData.map((s, idx) => (
              <div 
                key={s.site_location_id} 
                className="map-pin" 
                style={{ 
                  left: `${(idx * 15) % 80 + 10}%`, 
                  top: `${(idx * 23) % 70 + 15}%` 
                }}
                onClick={() => openEdit(s)}
              >
                <div className="map-pin-icon" />
                <div className="map-pin-label">{s.site_name}</div>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: '24px', right: '24px', background: 'rgba(255,255,255,0.9)', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', color: '#64748b', border: '1px solid #e2e8f0' }}>
            <strong>Map Visualization</strong><br/>
            Interactive pins showing sites by geographic clusters.
          </div>
        </div>
      )}

      <Modal 
        isOpen={modal} 
        onClose={() => setModal(false)} 
        title={editing ? 'Edit Site Location' : 'New Site Location'} 
        width="640px"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Customer *</label>
            <select className="form-select" value={form.customer_id} onChange={e => onChange('customer_id', e.target.value)} required>
              <option value="">-- Select Customer --</option>
              {customers.map(c => (
                <option key={c.customer_id} value={c.customer_id}>{c.customer_name} ({c.customer_code})</option>
              ))}
            </select>
          </div>
          <div className="form-group full-width">
            <label className="form-label">Site Name *</label>
            <input className="form-input" value={form.site_name} onChange={e => onChange('site_name', e.target.value)} required />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Address Line 1 *</label>
            <input className="form-input" value={form.address_line1} onChange={e => onChange('address_line1', e.target.value)} required/>
          </div>
          <div className="form-group full-width">
            <label className="form-label">Address Line 2</label>
            <input className="form-input" value={form.address_line2 || ''} onChange={e => onChange('address_line2', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" value={form.city} onChange={e => onChange('city', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input className="form-input" value={form.state} onChange={e => onChange('state', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Pincode</label>
            <input className="form-input" value={form.pincode} onChange={e => onChange('pincode', e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

