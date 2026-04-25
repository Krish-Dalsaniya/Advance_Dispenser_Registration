import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHeaderAction } from '../context/HeaderActionContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { Plus, Search, UserPlus, Trash2 } from 'lucide-react';

const emptyForm = {
  username: '', password: '', first_name: '', last_name: '',
  email: '', mobile_no: '', role_id: '', department: '', designation: '', is_active: true,
};

export default function UsersPage() {
  const { apiFetch } = useAuth();
  const { setAction } = useHeaderAction();
  const [data, setData] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/users');
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
  }, [apiFetch]);

  const loadRoles = useCallback(async () => {
    try {
      const res = await apiFetch('/api/roles');
      if (res.ok) setRoles(await res.json());
    } catch (e) { console.error(e); }
  }, [apiFetch]);

  useEffect(() => { load(); loadRoles(); }, [load, loadRoles]);

  const openCreate = useCallback(() => { setForm(emptyForm); setEditing(null); setModal(true); }, []);
  const openEdit = (row) => { setForm({ ...row, password: '' }); setEditing(row.user_id); setModal(true); };

  const handleDelete = async (row) => {
    if (!confirm(`Deactivate user "${row.username}"?`)) return;
    await apiFetch(`/api/users/${row.user_id}`, { method: 'DELETE' });
    load();
  };

  const handleBulkDelete = useCallback(async () => {
    if (!confirm(`Delete ${selectedIds.length} selected users?`)) return;
    // Mock bulk delete
    for (const id of selectedIds) {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
    }
    setSelectedIds([]);
    load();
  }, [selectedIds, apiFetch, load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editing ? `/api/users/${editing}` : '/api/users';
    await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
    setModal(false);
    load();
  };

  const onChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Header Action with Bulk Delete support
  useEffect(() => {
    if (selectedIds.length > 0) {
      setAction(
        <button className="btn btn-danger" onClick={handleBulkDelete}>
          <Trash2 size={16} /> Delete Selected ({selectedIds.length})
        </button>
      );
    } else {
      setAction(
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add User
        </button>
      );
    }
    return () => setAction(null);
  }, [setAction, openCreate, selectedIds, handleBulkDelete]);

  const filteredData = useMemo(() => {
    return data.filter(u => {
      const matchesSearch = !search || 
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole = roleFilter === 'All' || u.role_name === roleFilter;
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' ? u.is_active : !u.is_active);
      const matchesDept = deptFilter === 'All' || u.department === deptFilter;
      
      return matchesSearch && matchesRole && matchesStatus && matchesDept;
    });
  }, [data, search, roleFilter, statusFilter, deptFilter]);

  const departments = useMemo(() => ['All', ...new Set(data.map(u => u.department).filter(Boolean))], [data]);

  const columns = [
    { 
      key: 'name', 
      label: 'User', 
      render: (_, row) => (
        <div className="user-name-cell">
          <div className="user-avatar">
            {row.first_name?.[0]}{row.last_name?.[0]}
          </div>
          <div className="user-info-stack">
            <span className="user-full-name">{row.first_name} {row.last_name}</span>
            <span className="user-username">@{row.username}</span>
          </div>
        </div>
      )
    },
    { 
      key: 'email', 
      label: 'Email',
      render: (val) => <a href={`mailto:${val}`} className="link" style={{ color: '#0f4c81' }}>{val}</a>
    },
    { 
      key: 'mobile_no', 
      label: 'Mobile',
      render: (val) => <span className="mono">{val || '—'}</span>
    },
    { key: 'role_name', label: 'Role', badge: true },
    { key: 'department', label: 'Department' },
    { key: 'is_active', label: 'Status', type: 'boolean' },
  ];

  if (data.length === 0) {
    return (
      <EmptyState 
        icon={UserPlus}
        title="No users yet"
        description="Add team members to manage access and roles"
        actionLabel="Add First User"
        onAction={openCreate}
      />
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Users & Roles</h1>
          <p className="page-subtitle">Manage administrative access and team permissions</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-left">
          <div className="search-container">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by name, email, or username…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-chips">
            <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="All">Role: All</option>
              {roles.map(r => <option key={r.role_id} value={r.role_name}>{r.role_name}</option>)}
            </select>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">Status: All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select className="filter-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'Department: All' : d}</option>)}
            </select>
          </div>
        </div>
        <div className="record-count">{filteredData.length} users</div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredData} 
        onEdit={openEdit} 
        onDelete={handleDelete}
        selectable
        onSelectionChange={setSelectedIds}
        expandable
        rowIdKey="user_id"
        renderExpansion={(row) => (
          <>
            <div className="expansion-field">
              <span className="expansion-label">Designation</span>
              <span className="expansion-value">{row.designation || '—'}</span>
            </div>
            <div className="expansion-field">
              <span className="expansion-label">Department</span>
              <span className="expansion-value">{row.department || '—'}</span>
            </div>
            <div className="expansion-field">
              <span className="expansion-label">Last Login</span>
              <span className="expansion-value">{row.last_login ? new Date(row.last_login).toLocaleString() : 'Never'}</span>
            </div>
            <div className="expansion-field">
              <span className="expansion-label">Created At</span>
              <span className="expansion-value">{new Date(row.entry_date_time).toLocaleDateString()}</span>
            </div>
          </>
        )}
      />

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit User' : 'Create User'}
        width="640px"
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
            <div className="form-group full-width">
              <label className="form-label">Designation</label>
              <input className="form-input" value={form.designation} onChange={e => onChange('designation', e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
