import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';

const columns = [
  { key: 'device_id', label: 'Device ID' },
  { key: 'serial_number', label: 'Serial No' },
  { key: 'device_uid', label: 'Device UID' },
  { key: 'model_name', label: 'Model' },
  { key: 'customer_name', label: 'Customer' },
  { key: 'project_name', label: 'Project' },
  { key: 'iot_sim_no', label: 'SIM No' },
  { key: 'mac_address', label: 'MAC Address' },
  { key: 'installation_date', label: 'Installed', type: 'date' },
  { key: 'warranty_end', label: 'Warranty End', type: 'date' },
];

export default function DevicesPage() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sales, setSales] = useState([]);
  const [models, setModels] = useState([]);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [error, setError] = useState('');
  const [viewData, setViewData] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    load();
    loadDropdowns();
  }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/devices');
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadDropdowns = async () => {
    try {
      const [c, m, p, s, dm] = await Promise.all([
        apiFetch('/api/customers'), apiFetch('/api/products'),
        apiFetch('/api/projects'), apiFetch('/api/sales'),
        apiFetch('/api/dispenser-models'),
      ]);
      if (c.ok) setCustomers(await c.json());
      if (m.ok) setProducts(await m.json());
      if (p.ok) setProjects(await p.json());
      if (s.ok) setSales(await s.json());
      if (dm.ok) setModels(await dm.json());
    } catch (e) { console.error(e); }
  };

  const openView = async (row) => {
    try {
      const res = await apiFetch(`/api/devices/${row.device_id}`);
      if (res.ok) { setViewData(await res.json()); setViewModal(true); }
    } catch (e) { console.error(e); }
  };

  const openCreate = () => {
    setForm({
      serial_number: '', device_uid: '', customer_id: '', model_id: '',
      project_id: '', sale_id: '', dispenser_id: '', firmware_id: '',
      iot_sim_no: '', imei_no: '', mac_address: '',
      installation_date: '', warranty_start: '', warranty_end: '',
    });
    setError('');
    setEditing(null);
    setModal(true);
  };

  const openEdit = (row) => {
    setForm({
      ...row,
      installation_date: row.installation_date ? row.installation_date.split('T')[0] : '',
      warranty_start: row.warranty_start ? row.warranty_start.split('T')[0] : '',
      warranty_end: row.warranty_end ? row.warranty_end.split('T')[0] : '',
    });
    setError('');
    setEditing(row.device_id);
    setModal(true);
  };

  const handleDelete = async (row) => {
    if (!confirm(`Delete device "${row.serial_number}"?`)) return;
    await apiFetch(`/api/devices/${row.device_id}`, { method: 'DELETE' });
    load();
  };

  const handleSubmit = async () => {
    try {
      const url = editing ? `/api/devices/${editing}` : '/api/devices';
      await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setModal(false);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const onChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Device Registration</h1>
          <p className="page-subtitle">Register and track field-installed dispensers</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Register Device</button>
      </div>

      <DataTable columns={columns} data={data} onView={openView} onEdit={openEdit} onDelete={handleDelete} />

      {/* View Modal */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Device Details" width="640px">
        {viewData && (
          <div>
            <h3 style={{ marginBottom: 16, color: 'var(--accent-blue-light)' }}>
              {viewData.serial_number}
            </h3>
            <div className="form-grid">
              {[
                ['Device UID', viewData.device_uid],
                ['Model', viewData.model_name],
                ['Type', viewData.dispenser_type],
                ['Fuel', viewData.fuel_type],
                ['Customer', viewData.customer_name],
                ['Company', viewData.company_name],
                ['Location', `${viewData.city || ''}, ${viewData.state || ''}`],
                ['Project', viewData.project_name],
                ['PO Number', viewData.po_number],
                ['SIM No', viewData.iot_sim_no],
                ['IMEI', viewData.imei_no],
                ['MAC Address', viewData.mac_address],
                ['Installed', viewData.installation_date?.split('T')[0]],
                ['Warranty', `${viewData.warranty_start?.split('T')[0] || '—'} → ${viewData.warranty_end?.split('T')[0] || '—'}`],
              ].map(([label, val]) => (
                <div key={label}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{label}</span>
                  <br />
                  <span style={{ fontSize: '0.85rem' }}>{val || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Device' : 'Register New Device'} width="700px" error={error}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Register'}</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Serial Number *</label>
            <input className="form-input" value={form.serial_number || ''} onChange={e => onChange('serial_number', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Device UID *</label>
            <input className="form-input" value={form.device_uid || ''} onChange={e => onChange('device_uid', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Customer</label>
            <select className="form-select" value={form.customer_id || ''} onChange={e => onChange('customer_id', e.target.value)}>
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Product Assembly *</label>
            <select className="form-select" value={form.dispenser_id || ''} onChange={e => onChange('dispenser_id', e.target.value)} required>
              <option value="">Select Assembly</option>
              {products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name} ({p.production_serial_no})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Dispenser Model</label>
            <select className="form-select" value={form.model_id || ''} onChange={e => onChange('model_id', e.target.value)}>
              <option value="">Select Model</option>
              {models.map(m => <option key={m.dispenser_model_id} value={m.dispenser_model_id}>{m.model_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Project</label>
            <select className="form-select" value={form.project_id || ''} onChange={e => onChange('project_id', e.target.value)}>
              <option value="">Select Project</option>
              {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Sales Order</label>
            <select className="form-select" value={form.sale_id || ''} onChange={e => onChange('sale_id', e.target.value)}>
              <option value="">Select Order</option>
              {sales.map(s => <option key={s.sales_id} value={s.sales_id}>{s.sales_id} — {s.po_number}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">IoT SIM No</label>
            <input className="form-input" value={form.iot_sim_no || ''} onChange={e => onChange('iot_sim_no', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">IMEI No</label>
            <input className="form-input" value={form.imei_no || ''} onChange={e => onChange('imei_no', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">MAC Address</label>
            <input className="form-input" value={form.mac_address || ''} onChange={e => onChange('mac_address', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Installation Date</label>
            <input className="form-input" type="date" value={form.installation_date} onChange={e => onChange('installation_date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Warranty Start</label>
            <input className="form-input" type="date" value={form.warranty_start} onChange={e => onChange('warranty_start', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Warranty End</label>
            <input className="form-input" type="date" value={form.warranty_end} onChange={e => onChange('warranty_end', e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
