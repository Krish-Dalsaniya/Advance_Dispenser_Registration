import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';

const columns = [
  { key: 'project_id', label: 'ID' },
  { key: 'project_name', label: 'Project Name' },
  { key: 'customer_name', label: 'Customer' },
  { key: 'project_type', label: 'Type' },
  { key: 'status', label: 'Status', badge: true },
  { key: 'start_date', label: 'Start', type: 'date' },
  { key: 'end_date', label: 'End', type: 'date' },
  { key: 'created_by', label: 'Created By' },
];

export default function ProjectsPage() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [form, setForm] = useState({ project_name: '', customer_id: '', project_type: '', status: 'active', start_date: '', end_date: '', description: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { load(); loadCustomers(); }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/projects');
      if (res.ok) setData(await res.json());
    } catch(e) { console.error(e); }
  };

  const loadCustomers = async () => {
    try {
      const res = await apiFetch('/api/customers');
      if (res.ok) setCustomers(await res.json());
    } catch(e) { console.error(e); }
  };

  const openView = async (row) => {
    try {
      const res = await apiFetch(`/api/projects/${row.project_id}`);
      if (res.ok) { setViewData(await res.json()); setViewModal(true); }
    } catch(e) { console.error(e); }
  };

  const openCreate = () => {
    setForm({ project_name: '', customer_id: '', project_type: '', status: 'active', start_date: '', end_date: '', description: '' });
    setError('');
    setEditing(null);
    setModal(true);
  };

  const openEdit = (row) => {
    setForm({
      ...row,
      start_date: row.start_date ? row.start_date.split('T')[0] : '',
      end_date: row.end_date ? row.end_date.split('T')[0] : '',
    });
    setError('');
    setEditing(row.project_id);
    setModal(true);
  };

  const handleDelete = async (row) => {
    if (!confirm(`Delete project "${row.project_name}"?`)) return;
    await apiFetch(`/api/projects/${row.project_id}`, { method: 'DELETE' });
    load();
  };

  const handleSubmit = async () => {
    try {
      const url = editing ? `/api/projects/${editing}` : '/api/projects';
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
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Track installation projects and team assignments</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Project</button>
      </div>

      <DataTable columns={columns} data={data} onView={openView} onEdit={openEdit} onDelete={handleDelete} />

      {/* View Modal */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Project Details" width="640px">
        {viewData && (
          <div>
            <h3 style={{ marginBottom: 8, color: 'var(--accent-blue-light)' }}>{viewData.project_name}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.85rem' }}>{viewData.description}</p>
            <div className="form-grid" style={{ marginBottom: 20 }}>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Customer</span><br />{viewData.customer_name}</div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Type</span><br />{viewData.project_type}</div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Status</span><br /><span className={`badge badge-${viewData.status}`}>{viewData.status}</span></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Duration</span><br />{viewData.start_date?.split('T')[0]} → {viewData.end_date?.split('T')[0]}</div>
            </div>
            {viewData.team?.length > 0 && (
              <div>
                <h4 style={{ marginBottom: 8, fontSize: '0.9rem' }}>Team Members</h4>
                {viewData.team.map(t => (
                  <div key={t.team_id} className="inventory-item">
                    <div>
                      <span className="item-name">{t.first_name} {t.last_name}</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.role_in_project}</span>
                    </div>
                    <span className="item-count">{t.allocation_percent}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Project' : 'New Project'} width="640px" error={error}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Project Name *</label>
            <input className="form-input" value={form.project_name} onChange={e => onChange('project_name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Customer</label>
            <select className="form-select" value={form.customer_id} onChange={e => onChange('customer_id', e.target.value)}>
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Project Type</label>
            <select className="form-select" value={form.project_type} onChange={e => onChange('project_type', e.target.value)}>
              <option value="">Select Type</option>
              <option value="New Installation">New Installation</option>
              <option value="Upgrade">Upgrade</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Decommission">Decommission</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => onChange('status', e.target.value)}>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input className="form-input" type="date" value={form.start_date} onChange={e => onChange('start_date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input className="form-input" type="date" value={form.end_date} onChange={e => onChange('end_date', e.target.value)} />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description || ''} onChange={e => onChange('description', e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
