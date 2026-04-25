import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHeaderAction } from '../context/HeaderActionContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { 
  Plus, Search, Cpu, Monitor, Signal, Copy, 
  MapPin, Rocket, ExternalLink, Trash2, Edit2, 
  CheckCircle2, XCircle, AlertCircle, ArrowRight
} from 'lucide-react';

export default function DevicesPage() {
  const { apiFetch } = useAuth();
  const { setAction } = useHeaderAction();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [models, setModels] = useState([]);
  const [sales, setSales] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modelFilter, setModelFilter] = useState('All');

  useEffect(() => {
    load();
    loadDropdowns();
  }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/devices');
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadDropdowns = async () => {
    try {
      const [c, m, p, dm, s] = await Promise.all([
        apiFetch('/api/customers'), apiFetch('/api/products'),
        apiFetch('/api/projects'), apiFetch('/api/dispenser-models'),
        apiFetch('/api/sales')
      ]);
      if (c.ok) setCustomers(await c.json());
      if (m.ok) setProducts(await m.json());
      if (p.ok) setProjects(await p.json());
      if (dm.ok) setModels(await dm.json());
      if (s.ok) setSales(await s.json());
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/devices/${editing}` : '/api/devices';
      await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setModal(false);
      load();
    } catch (err) { setError(err.message); }
  };

  const openCreate = useCallback(() => {
    setForm({
      serial_number: '', device_uid: '', customer_id: '', model_id: '',
      project_id: '', sale_id: '', dispenser_id: '', firmware_id: '',
      iot_sim_no: '', imei_no: '', mac_address: '',
      installation_date: new Date().toISOString().split('T')[0],
    });
    setError('');
    setEditing(null);
    setModal(true);
  }, []);

  useEffect(() => {
    setAction(
      <button className="btn btn-primary" onClick={openCreate}>
        <Plus size={16} /> Register Device
      </button>
    );
    return () => setAction(null);
  }, [setAction, openCreate]);

  const handleCopy = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const searchStr = `${d.serial_number} ${d.device_uid} ${d.customer_name} ${d.model_name}`.toLowerCase();
      const matchesSearch = !search || searchStr.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
      const matchesModel = modelFilter === 'All' || d.model_name === modelFilter;
      return matchesSearch && matchesStatus && matchesModel;
    });
  }, [data, search, statusFilter, modelFilter]);

  const columns = [
    {
      key: 'device_id',
      label: 'Device ID',
      render: (val) => (
        <div className="uuid-pill" onClick={(e) => handleCopy(e, val)} title="Click to copy full ID">
          {val.substring(0, 8)}…
          <Copy size={10} className="copy-icon" />
        </div>
      )
    },
    {
      key: 'serial_number',
      label: 'Serial No',
      render: (val, row) => (
        <Link to={`/devices/${row.device_id}`} style={{ fontWeight: 600, color: 'var(--color-text)', textDecoration: 'none' }}>
          {val}
        </Link>
      )
    },
    {
      key: 'model_name',
      label: 'Model',
      render: (val) => <span className="badge badge-engineer" style={{ fontSize: '11px' }}>{val}</span>
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (val) => <span style={{ fontSize: '13px' }}>{val}</span>
    },
    {
      key: 'project_name',
      label: 'Project',
      render: (val) => <Link to="/projects" style={{ fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none' }}>{val || '—'}</Link>
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className={`status-dot status-dot-${val === 'active' ? 'online' : 'offline'}`}></div>
          <span className={`badge badge-device-${val === 'active' ? 'online' : 'offline'}`} style={{ fontSize: '11px' }}>
            {val === 'active' ? 'Online' : 'Offline'}
          </span>
        </div>
      )
    }
  ];

  if (!loading && data.length === 0) {
    return (
      <EmptyState 
        icon={Cpu}
        title="No devices registered"
        description="Follow these steps to deploy hardware in the field:"
        onAction={openCreate}
        actionLabel="Start Registration"
      >
        <div style={{ marginTop: '24px', maxWidth: '400px', margin: '24px auto 0' }}>
          {[
            'Select Product Assembly',
            'Assign to Customer & Site',
            'Generate Unique Device UID',
            'Synchronize IoT Heartbeat'
          ].map((step, i) => (
            <div key={i} className="device-setup-step">
              <div className="step-number">{i + 1}</div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>{step}</span>
            </div>
          ))}
        </div>
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Device Registration</h1>
          <p className="page-subtitle">Registered IoT hardware and real-time connectivity status</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-left">
          <div className="search-container">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by serial, UID, model, or customer…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-chips">
            <select className="filter-select" value={modelFilter} onChange={e => setModelFilter(e.target.value)}>
              <option value="All">Model: All</option>
              {models.map(m => <option key={m.dispenser_model_id} value={m.model_name}>{m.model_name}</option>)}
            </select>
          </div>
        </div>
        <div className="record-count">{filteredData.length} devices</div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredData}
        expandable
        renderExpansion={(row) => (
          <div className="expansion-grid">
            <div className="expansion-section">
              <div className="expansion-section-title">Hardware Telemetry</div>
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div className="expansion-field">
                  <span className="expansion-label">Full Device UID</span>
                  <div className="uuid-pill" onClick={(e) => handleCopy(e, row.device_uid)}>
                    {row.device_uid} <Copy size={10} className="copy-icon" />
                  </div>
                </div>
                <div className="expansion-field">
                  <span className="expansion-label">MAC Address</span>
                  <code className="expansion-value">{row.mac_address || '—'}</code>
                </div>
                <div className="expansion-field">
                  <span className="expansion-label">IoT SIM Number</span>
                  <span className="expansion-value">{row.iot_sim_no || 'Not Configured'}</span>
                </div>
                <div className="expansion-field">
                  <span className="expansion-label">Installation Date</span>
                  <span className="expansion-value">{new Date(row.installation_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="expansion-section">
              <div className="expansion-section-title">Field Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/ota-updates')}>
                  <Rocket size={14} style={{ marginRight: '8px' }} /> Push OTA Update
                </button>
                <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/site-locations')}>
                  <MapPin size={14} style={{ marginRight: '8px' }} /> View on Site Map
                </button>
                <button className="btn btn-primary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => navigate(`/devices/${row.device_id}`)}>
                  <Activity size={14} style={{ marginRight: '8px' }} /> Detailed Analytics <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                </button>
              </div>
            </div>
          </div>
        )}
        onEdit={(row) => {
          setForm(row);
          setEditing(row.device_id);
          setModal(true);
        }}
        onDelete={async (row) => {
          if (!confirm(`Delete device "${row.serial_number}"?`)) return;
          await apiFetch(`/api/devices/${row.device_id}`, { method: 'DELETE' });
          load();
        }}
      />

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Device Configuration' : 'Register New Hardware Device'} width="700px" error={error}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Register Device'}</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Serial Number *</label>
            <input className="form-input" value={form.serial_number || ''} onChange={e => setForm({...form, serial_number: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Device UID *</label>
            <input className="form-input" value={form.device_uid || ''} onChange={e => setForm({...form, device_uid: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Customer</label>
            <select className="form-select" value={form.customer_id || ''} onChange={e => setForm({...form, customer_id: e.target.value})}>
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Model *</label>
            <select className="form-select" value={form.model_id || ''} onChange={e => setForm({...form, model_id: e.target.value})} required>
              <option value="">Select Model</option>
              {models.map(m => <option key={m.dispenser_model_id} value={m.dispenser_model_id}>{m.model_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Product Assembly (Dispenser) *</label>
            <select className="form-select" value={form.dispenser_id || ''} onChange={e => setForm({...form, dispenser_id: e.target.value})} required>
              <option value="">Select Product</option>
              {products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name} | {p.production_serial_no}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Firmware Build</label>
            <select className="form-select" value={form.firmware_id || ''} onChange={e => setForm({...form, firmware_id: e.target.value})}>
              <option value="">Select Firmware</option>
              {/* Note: In a real scenario, you might want to fetch firmware builds here */}
              <option value="">No Builds Available</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Project</label>
            <select className="form-select" value={form.project_id || ''} onChange={e => setForm({...form, project_id: e.target.value})}>
              <option value="">Select Project</option>
              {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
            </select>
          </div>
          <div className="form-group full-width">
            <label className="form-label">Sales Order *</label>
            <select className="form-select" value={form.sale_id || ''} onChange={e => setForm({...form, sale_id: e.target.value})} required>
              <option value="">Select Sales Order</option>
              {sales.filter(s => s.status === 'confirmed' || s.status === 'delivered').map(s => (
                <option key={s.sales_id} value={s.sales_id}>
                  ORD-{s.sales_id} | {s.customer_name} ({new Date(s.order_date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

