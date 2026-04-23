import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';

const columns = [
  { key: 'customer_code', label: 'Code' },
  { key: 'customer_name', label: 'Name' },
  { key: 'company_name', label: 'Company' },
  { key: 'contact_person', label: 'Contact Person' },
  { key: 'mobile_no', label: 'Mobile' },
  { key: 'email', label: 'Email' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'gst_no', label: 'GST No' },
  { key: 'status', label: 'Status', badge: true },
];

const emptyForm = {
  customer_code: '', customer_name: '', company_name: '', contact_person: '',
  mobile_no: '', email: '', address_line1: '', address_line2: '',
  city: '', state: '', country: 'India', pincode: '', gst_no: '', status: 'active',
};

export default function CustomersPage() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState([]);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/customers');
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
  };

  const openCreate = () => { setForm(emptyForm); setError(''); setEditing(null); setModal(true); };
  const openEdit = (row) => { setForm(row); setError(''); setEditing(row.customer_id); setModal(true); };

  const handleDelete = async (row) => {
    if (!confirm(`Deactivate customer "${row.customer_name}"?`)) return;
    await apiFetch(`/api/customers/${row.customer_id}`, { method: 'DELETE' });
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/customers/${editing}` : '/api/customers';
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
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage customer directory & contact information</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Customer</button>
      </div>

      <DataTable columns={columns} data={data} onEdit={openEdit} onDelete={handleDelete} />

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Customer' : 'New Customer'} width="640px" error={error}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Customer Code</label>
            <input className="form-input" value={form.customer_code} onChange={e => onChange('customer_code', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Customer Name *</label>
            <input className="form-input" value={form.customer_name} onChange={e => onChange('customer_name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input className="form-input" value={form.company_name} onChange={e => onChange('company_name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Person</label>
            <input className="form-input" value={form.contact_person} onChange={e => onChange('contact_person', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Mobile</label>
            <input className="form-input" value={form.mobile_no} onChange={e => onChange('mobile_no', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => onChange('email', e.target.value)} />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Address Line 1</label>
            <input className="form-input" value={form.address_line1} onChange={e => onChange('address_line1', e.target.value)} />
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
          <div className="form-group">
            <label className="form-label">GST No</label>
            <input className="form-input" value={form.gst_no} onChange={e => onChange('gst_no', e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
