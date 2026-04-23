import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';

const columns = [
  { key: 'username', label: 'Username' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'mobile_no', label: 'Mobile' },
  { key: 'role_name', label: 'Role' },
  { key: 'department', label: 'Department' },
  { key: 'designation', label: 'Designation' },
  { key: 'is_active', label: 'Status', type: 'boolean' },
];

const emptyForm = {
  username: '', password: '', first_name: '', last_name: '',
  email: '', mobile_no: '', role_id: '', department: '', designation: '', is_active: true,
};

export default function UsersPage() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); loadRoles(); }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/users');
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadRoles = async () => {
    try {
      const res = await apiFetch('/api/roles');
      if (res.ok) setRoles(await res.json());
    } catch (e) { console.error(e); }
  };

  const openCreate = () => { setForm(emptyForm); setEditing(null); setModal(true); };

  const openEdit = (row) => {
    setForm({ ...row, password: '' });
    setEditing(row.user_id);
    setModal(true);
  };

  const handleDelete = async (row) => {
    if (!confirm(`Deactivate user "${row.username}"?`)) return;
    await apiFetch(`/api/users/${row.user_id}`, { method: 'DELETE' });
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editing ? `/api/users/${editing}` : '/api/users';
    const method = editing ? 'PUT' : 'POST';
    await apiFetch(url, { method, body: JSON.stringify(form) });
    setModal(false);
    load();
  };

  const onChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users & Roles</h1>
          <p className="page-subtitle">Manage system users and their access roles</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add User
        </button>
      </div>

      <DataTable columns={columns} data={data} onEdit={openEdit} onDelete={handleDelete} />

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit User' : 'Create User'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editing ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={form.username} onChange={e => onChange('username', e.target.value)} required disabled={!!editing} />
            </div>
            {!editing && (
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={form.password} onChange={e => onChange('password', e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className="form-input" value={form.first_name} onChange={e => onChange('first_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" value={form.last_name} onChange={e => onChange('last_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => onChange('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile</label>
              <input className="form-input" value={form.mobile_no} onChange={e => onChange('mobile_no', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role_id} onChange={e => onChange('role_id', e.target.value)} required>
                <option value="">Select Role</option>
                {roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" value={form.department} onChange={e => onChange('department', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input className="form-input" value={form.designation} onChange={e => onChange('designation', e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
