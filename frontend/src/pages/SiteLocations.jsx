import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';

const columns = [
  { key: 'customer_name', label: 'Customer' },
  { key: 'site_name', label: 'Site Name' },
  { key: 'address_line1', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'pincode', label: 'Pincode' },
];

const emptyForm = {
  customer_id: '', site_name: '', address_line1: '', address_line2: '',
  city: '', state: '', country: 'India', pincode: '',
};

export default function SiteLocationsPage() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); loadCustomers(); }, []);

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

  const openCreate = () => { setForm(emptyForm); setEditing(null); setModal(true); };
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Site Locations</h1>
          <p className="page-subtitle">Manage installation sites for customers</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Site</button>
      </div>

      <DataTable columns={columns} data={data} onEdit={openEdit} onDelete={handleDelete} />

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Site Location' : 'New Site Location'} width="640px"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Customer *</label>
            <select className="form-input" value={form.customer_id} onChange={e => onChange('customer_id', e.target.value)} required>
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
