import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHeaderAction } from '../context/HeaderActionContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SlideOver from '../components/SlideOver';
import EmptyState from '../components/EmptyState';
import { 
  Plus, Search, Box, Copy, ExternalLink, User, 
  Clock, CheckCircle2, AlertTriangle, ArrowRight,
  Cpu, Droplet, Monitor, ShieldCheck, Settings, Layers
} from 'lucide-react';

const COMPONENT_GROUPS = [
  { id: 'basic', label: 'Basic Info', icon: Box },
  { id: 'electronics', label: 'Electronics', icon: Cpu },
  { id: 'fluid', label: 'Fluid Path', icon: Droplet },
  { id: 'peripherals', label: 'Peripherals', icon: Monitor },
  { id: 'sensors', label: 'Safety', icon: ShieldCheck },
];

const COMPONENT_FIELDS = [
  { key: 'motherboard_id', label: 'Motherboard', type: 'motherboard', category: 'electronics', sCol: 'production_serial_no' },
  { key: 'gsm_id', label: 'GSM Module', type: 'gsm', category: 'electronics', sCol: 'production_serial_no' },
  { key: 'back_panel_pcb_id', label: 'Back Panel PCB', type: 'back_panel_pcb', category: 'electronics', sCol: 'pcb_serial_no' },
  { key: 'smps_id', label: 'SMPS', type: 'smps', category: 'electronics', sCol: 'smps_serial_no' },
  { key: 'transformer_id', label: 'Transformer', type: 'transformer', category: 'electronics', sCol: 'transformer_serial_no' },
  { key: 'relay_box_id', label: 'Relay Box', type: 'relay_box', category: 'electronics', sCol: 'relay_box_serial_no' },
  { key: 'emi_emc_filter_id', label: 'EMI/EMC Filter', type: 'emi_emc_filter', category: 'electronics', sCol: 'filter_serial_no' },
  { key: 'pump_id', label: 'Pump', type: 'pump', category: 'fluid', sCol: 'pump_serial_no' },
  { key: 'solenoid_valve_id', label: 'Solenoid Valve', type: 'solenoid_valve', category: 'fluid', sCol: 'solenoid_serial_no' },
  { key: 'flowmeter_id', label: 'Flowmeter', type: 'flowmeter', category: 'fluid', sCol: 'flowmeter_serial_no' },
  { key: 'nozzle_id', label: 'Nozzle', type: 'nozzle', category: 'fluid', sCol: 'nozzle_serial_no' },
  { key: 'filter_id', label: 'Filter', type: 'filter', category: 'fluid', sCol: 'filter_serial_no' },
  { key: 'printer_id', label: 'Printer', type: 'printer', category: 'peripherals', sCol: 'printer_serial_no' },
  { key: 'battery_id', label: 'Battery', type: 'battery', category: 'peripherals', sCol: 'battery_serial_no' },
  { key: 'speaker_id', label: 'Speaker', type: 'speaker', category: 'peripherals', sCol: 'speaker_serial_no' },
  { key: 'amplifier_id', label: 'Amplifier', type: 'amplifier', category: 'peripherals', sCol: 'amplifier_serial_no' },
  { key: 'dc_meter_id', label: 'DC Meter', type: 'dc_meter', category: 'peripherals', sCol: 'dc_motor_serial_no' },
  { key: 'tank_sensor_id', label: 'Tank Sensor', type: 'tank_sensor', category: 'sensors', sCol: 'tank_sensor_serial_no' },
  { key: 'quality_sensor_id', label: 'Quality Sensor', type: 'quality_sensor', category: 'sensors', sCol: 'quality_sensor_serial_no' },
  { key: 'rccb_id', label: 'RCCB', type: 'rccb', category: 'sensors', sCol: 'rccb_serial_no' },
  { key: 'spd_id', label: 'SPD', type: 'spd', category: 'sensors', sCol: 'spd_serial_no' },
  { key: 'pressure_sensor_id', label: 'Pressure Sensor', type: 'pressure_sensor', category: 'sensors', sCol: 'pressure_sensor_serial_no' },
];

function formatRelativeTime(date) {
  if (!date) return '—';
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return d.toLocaleDateString('en-IN');
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

export default function ProductsPage() {
  const { apiFetch } = useAuth();
  const { setAction } = useHeaderAction();
  const navigate = useNavigate();
  
  const [data, setData] = useState([]);
  const [models, setModels] = useState([]);
  const [components, setComponents] = useState({});
  const [devices, setDevices] = useState([]);
  
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [activeFormTab, setActiveFormTab] = useState('basic');
  const [error, setError] = useState('');

  // Details
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [fuelFilter, setFuelFilter] = useState('All');

  useEffect(() => { 
    load(); 
    loadModels();
    loadComponents();
    loadDevices();
  }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/products');
      if (res.ok) setData(await res.json());
    } catch(e) { console.error(e); }
  };

  const loadModels = async () => {
    try {
      const res = await apiFetch('/api/dispenser-models');
      if (res.ok) setModels(await res.json());
    } catch(e) { console.error(e); }
  };

  const loadDevices = async () => {
    try {
      const res = await apiFetch('/api/devices');
      if (res.ok) setDevices(await res.json());
    } catch(e) { console.error(e); }
  };

  const loadComponents = async () => {
    const types = [...new Set(COMPONENT_FIELDS.map(f => f.type))];
    const newComponents = {};
    for (const type of types) {
      try {
        const res = await apiFetch(`/api/components/${type}`);
        if (res.ok) newComponents[type] = await res.json();
      } catch (e) { console.error(`Error loading ${type}:`, e); }
    }
    setComponents(newComponents);
  };

  const openCreate = useCallback(() => {
    setForm({ product_name: '', product_description: '', dispenser_model_id: '', production_serial_no: '', manufacturing_batch: '' });
    setError('');
    setEditing(null);
    setActiveFormTab('basic');
    setModal(true);
  }, []);

  useEffect(() => {
    setAction(
      <button className="btn btn-primary" onClick={openCreate}>
        <Plus size={16} /> Add Product
      </button>
    );
    return () => setAction(null);
  }, [setAction, openCreate]);

  const openDetails = async (product) => {
    try {
      const res = await apiFetch(`/api/products/${product.product_id}`);
      if (res.ok) {
        setSelectedProduct(await res.json());
        setIsSlideOverOpen(true);
      }
    } catch(e) { console.error(e); }
  };

  const handleCopy = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    // Could add a toast here
  };

  const filteredData = useMemo(() => {
    return data.filter(p => {
      const searchStr = `${p.product_name} ${p.model_name} ${p.production_serial_no} ${p.manufacturing_batch}`.toLowerCase();
      const matchesSearch = !search || searchStr.includes(search.toLowerCase());
      const matchesModel = modelFilter === 'All' || p.model_name === modelFilter;
      const matchesType = typeFilter === 'All' || p.dispenser_type === typeFilter;
      const matchesFuel = fuelFilter === 'All' || p.fuel_type === fuelFilter;
      return matchesSearch && matchesModel && matchesType && matchesFuel;
    });
  }, [data, search, modelFilter, typeFilter, fuelFilter]);

  const columns = [
    { 
      key: 'product_id', 
      label: 'ID',
      render: (val) => (
        <div className="uuid-pill" onClick={(e) => handleCopy(e, val)} title="Click to copy full ID">
          {val.substring(0, 8)}…
          <Copy size={10} className="copy-icon" />
        </div>
      )
    },
    { 
      key: 'product_name', 
      label: 'Product Name',
      render: (val, row) => (
        <span className="product-name-cell" onClick={() => openDetails(row)}>{val}</span>
      )
    },
    { 
      key: 'model_name', 
      label: 'Model',
      render: (val, row) => (
        <Link 
          to="/dispenser-models" 
          className="badge badge-engineer" 
          style={{ textDecoration: 'none', cursor: 'pointer' }}
          onClick={(e) => e.stopPropagation()}
        >
          {val}
        </Link>
      )
    },
    { 
      key: 'dispenser_type', 
      label: 'Type',
      render: (val) => <span className={`badge ${val === 'Mini' ? 'badge-admin' : 'badge-completed'}`}>{val}</span>
    },
    { 
      key: 'fuel_type', 
      label: 'Fuel',
      render: (val) => <span className={`badge ${val === 'Diesel' ? 'badge-fuel-diesel' : 'badge-fuel-def'}`}>{val}</span>
    },
    { 
      key: 'production_serial_no', 
      label: 'Serial No',
      render: (val) => <code style={{ fontSize: '12px' }}>{val || '—'}</code>
    },
    { 
      key: 'manufacturing_batch', 
      label: 'Batch',
      render: (val) => <code style={{ fontSize: '11px' }}>{val || '—'}</code>
    },
    {
      key: 'entry_by_username',
      label: 'Created By',
      render: (val) => (
        <div className="user-avatar-stack">
          <div className="avatar-initials">{val?.substring(0, 2).toUpperCase()}</div>
          <span style={{ fontSize: '12px' }}>{val}</span>
        </div>
      )
    },
    {
      key: 'entry_date_time',
      label: 'Created At',
      render: (val) => (
        <span className="relative-date" title={new Date(val).toLocaleString()}>
          {formatRelativeTime(val)}
        </span>
      )
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/products/${editing}` : '/api/products';
      await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setModal(false);
      load();
    } catch (err) { setError(err.message); }
  };

  const onChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  if (data.length === 0) {
    return (
      <EmptyState 
        icon={Box}
        title="No products assembled"
        description="Physical dispenser units are created by assembling components based on model templates"
        actionLabel="Start New Assembly"
        onAction={openCreate}
      />
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your retail product catalog and pricing</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-left">
          <div className="search-container">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by name, model, serial no…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-chips">
            <select className="filter-select" value={modelFilter} onChange={e => setModelFilter(e.target.value)}>
              <option value="All">Model: All</option>
              {models.map(m => <option key={m.dispenser_model_id} value={m.model_name}>{m.model_name}</option>)}
            </select>
            <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="All">Type: All</option>
              <option value="Mini">Mini</option>
              <option value="Tower">Tower</option>
              <option value="Storage">Storage</option>
            </select>
            <select className="filter-select" value={fuelFilter} onChange={e => setFuelFilter(e.target.value)}>
              <option value="All">Fuel: All</option>
              <option value="Diesel">Diesel</option>
              <option value="DEF">DEF</option>
            </select>
          </div>
        </div>
        <div className="record-count">{filteredData.length} products</div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredData}
        expandable
        renderExpansion={(row) => {
          const isRegistered = devices.some(d => d.product_id === row.product_id);
          const device = devices.find(d => d.product_id === row.product_id);
          
          return (
            <div className="expansion-grid">
              <div className="expansion-section">
                <div className="expansion-section-title">Deployment Status</div>
                {isRegistered ? (
                  <div className="expansion-link-item" onClick={() => navigate('/devices')}>
                    <CheckCircle2 size={16} color="#10b981" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>Registered as Device</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Device ID: {device.device_id.substring(0, 8)}…</div>
                    </div>
                    <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                  </div>
                ) : (
                  <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/devices')}>
                    Register as Device <ArrowRight size={14} style={{ marginLeft: '8px' }} />
                  </button>
                )}
                <div className="expansion-field" style={{ marginTop: '16px' }}>
                  <span className="expansion-label">Full Product ID</span>
                  <div className="uuid-pill" onClick={(e) => handleCopy(e, row.product_id)}>
                    {row.product_id}
                    <Copy size={10} className="copy-icon" />
                  </div>
                </div>
              </div>

              <div className="expansion-section">
                <div className="expansion-section-title">Linked Resources</div>
                <div className="expansion-link-item" onClick={() => navigate('/firmware-versions')}>
                  <Layers size={16} color="#0f4c81" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>Firmware Build</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Latest stable version available</div>
                  </div>
                  <ExternalLink size={14} style={{ marginLeft: 'auto' }} />
                </div>
                {device?.site_name && (
                  <div className="expansion-link-item" onClick={() => navigate('/site-locations')}>
                    <Settings size={16} color="#0f4c81" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>Installed at {device.site_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{device.customer_name}</div>
                    </div>
                    <ExternalLink size={14} style={{ marginLeft: 'auto' }} />
                  </div>
                )}
              </div>
            </div>
          );
        }}
        onEdit={(row) => {
          setForm(row);
          setEditing(row.product_id);
          setModal(true);
        }}
        onDelete={async (row) => {
          if (!confirm(`Delete product "${row.product_name}"?`)) return;
          await apiFetch(`/api/products/${row.product_id}`, { method: 'DELETE' });
          load();
        }}
      />

      <SlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        title="Product Assembly Details"
        width="640px"
      >
        {selectedProduct && (
          <div className="product-detail-content">
            <div className="detail-section">
              <div className="detail-section-title">Hardware Architecture</div>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="expansion-field">
                  <span className="expansion-label">Model Series</span>
                  <span className="expansion-value" style={{ fontWeight: 600 }}>{selectedProduct.model_name}</span>
                </div>
                <div className="expansion-field">
                  <span className="expansion-label">Serial Number</span>
                  <span className="expansion-value">{selectedProduct.production_serial_no || 'Not Assigned'}</span>
                </div>
                <div className="expansion-field">
                  <span className="expansion-label">Manufacturing Date</span>
                  <span className="expansion-value">{selectedProduct.manufacturing_date_time ? new Date(selectedProduct.manufacturing_date_time).toLocaleDateString() : '—'}</span>
                </div>
                <div className="expansion-field">
                  <span className="expansion-label">Batch Code</span>
                  <span className="expansion-value">{selectedProduct.manufacturing_batch || '—'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Bill of Materials (BOM)</div>
              {COMPONENT_GROUPS.slice(1).map(group => (
                <div key={group.id} style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#0f4c81' }}>
                    <group.icon size={16} />
                    <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>{group.label}</span>
                  </div>
                  <div className="bom-stack" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {COMPONENT_FIELDS.filter(f => f.category === group.id).map(field => {
                      const serial = selectedProduct[`${field.type}_serial`];
                      return (
                        <div key={field.key} className="linked-item" style={{ padding: '8px 12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{field.label}</div>
                            <div style={{ fontSize: '13px', fontWeight: 500 }}>{serial || <span style={{ color: '#ef4444', fontStyle: 'italic', fontWeight: 400 }}>Not Assigned</span>}</div>
                          </div>
                          {serial && <CheckCircle2 size={14} color="#10b981" />}
                          {!serial && <AlertTriangle size={14} color="#f59e0b" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SlideOver>

      <Modal 
        isOpen={modal} 
        onClose={() => setModal(false)} 
        title={editing ? 'Edit Product' : 'New Product Assembly'}
        width="850px"
        error={error}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Register Assembly'}</button>
        </>}
      >
        <div className="tabs" style={{ marginBottom: 20 }}>
          {COMPONENT_GROUPS.map(g => (
            <button 
              key={g.id} 
              className={`tab ${activeFormTab === g.id ? 'active' : ''}`}
              onClick={() => setActiveFormTab(g.id)}
            >
              <g.icon size={14} style={{ marginRight: '8px' }} />
              {g.label}
            </button>
          ))}
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
          {activeFormTab === 'basic' && (
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Product Name *</label>
                <input className="form-input" value={form.product_name || ''} onChange={e => onChange('product_name', e.target.value)} required />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.product_description || ''} onChange={e => onChange('product_description', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Dispenser Model</label>
                <select className="form-select" value={form.dispenser_model_id || ''} onChange={e => onChange('dispenser_model_id', e.target.value)}>
                  <option value="">Select Model</option>
                  {models.map(m => <option key={m.dispenser_model_id} value={m.dispenser_model_id}>{m.model_name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Production Serial No</label>
                <input className="form-input" placeholder="e.g. SN-DISP-2025-001" value={form.production_serial_no || ''} onChange={e => onChange('production_serial_no', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Manufacturing Date</label>
                <input className="form-input" type="datetime-local" value={form.manufacturing_date_time || ''} onChange={e => onChange('manufacturing_date_time', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Batch</label>
                <input className="form-input" value={form.manufacturing_batch || ''} onChange={e => onChange('manufacturing_batch', e.target.value)} />
              </div>
            </div>
          )}

          {COMPONENT_GROUPS.slice(1).map(group => (
            activeFormTab === group.id && (
              <div key={group.id} className="form-grid">
                {COMPONENT_FIELDS.filter(f => f.category === group.id).map(field => (
                  <div key={field.key} className="form-group">
                    <label className="form-label">{field.label}</label>
                    <select 
                      className="form-select" 
                      value={form[field.key] || ''} 
                      onChange={e => onChange(field.key, e.target.value)}
                    >
                      <option value="">Not Assigned</option>
                      {(components[field.type] || []).map(c => {
                        const pk = Object.keys(c).find(k => k.includes('_id'));
                        return (
                          <option key={c[pk]} value={c[pk]}>
                            {c[field.sCol]} {c.manufacturing_batch ? `(${c.manufacturing_batch})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ))}
              </div>
            )
          ))}
        </div>
      </Modal>
    </div>
  );
}

