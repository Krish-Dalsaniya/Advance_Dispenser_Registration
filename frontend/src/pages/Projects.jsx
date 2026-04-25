import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHeaderAction } from '../context/HeaderActionContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { 
  Plus, Search, LayoutGrid, List, User, Calendar, 
  CheckCircle2, Clock, PauseCircle, ChevronRight,
  Box, MapPin, ExternalLink, Trash2, Edit2, Archive
} from 'lucide-react';

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
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

const KANBAN_COLUMNS = [
  { id: 'planning', label: 'Planning', badge: 'badge-project-planning' },
  { id: 'active', label: 'In Progress', badge: 'badge-project-progress' },
  { id: 'on_hold', label: 'On Hold', badge: 'badge-project-hold' },
  { id: 'completed', label: 'Complete', badge: 'badge-project-complete' }
];

export default function ProjectsPage() {
  const { apiFetch } = useAuth();
  const { setAction } = useHeaderAction();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ project_name: '', customer_id: '', project_type: '', status: 'planning', start_date: '', end_date: '', description: '' });
  const [editing, setEditing] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');

  useEffect(() => { load(); loadCustomers(); }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/projects');
      if (res.ok) setData(await res.json());
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadCustomers = async () => {
    try {
      const res = await apiFetch('/api/customers');
      if (res.ok) setCustomers(await res.json());
    } catch(e) { console.error(e); }
  };

  const openCreate = useCallback(() => {
    setForm({ project_name: '', customer_id: '', project_type: 'New Installation', status: 'planning', start_date: new Date().toISOString().split('T')[0], end_date: '', description: '' });
    setError('');
    setEditing(null);
    setModal(true);
  }, []);

  useEffect(() => {
    setAction(
      <button className="btn btn-primary" onClick={openCreate}>
        <Plus size={16} /> New Project
      </button>
    );
    return () => setAction(null);
  }, [setAction, openCreate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/projects/${editing}` : '/api/projects';
      await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setModal(false);
      load();
    } catch (err) { setError(err.message); }
  };

  const filteredData = useMemo(() => {
    return data.filter(p => {
      const searchStr = `${p.project_name} ${p.customer_name} ${p.site_name}`.toLowerCase();
      const matchesSearch = !search || searchStr.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesCustomer = customerFilter === 'All' || p.customer_name === customerFilter;
      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [data, search, statusFilter, customerFilter]);

  const columns = [
    {
      key: 'project_name',
      label: 'Project Name',
      render: (val, row) => (
        <Link to={`/projects/${row.project_id}`} style={{ fontWeight: 600, color: 'var(--color-text)', textDecoration: 'none' }}>
          {val}
        </Link>
      )
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (val) => (
        <span className="badge badge-engineer">{val}</span>
      )
    },
    {
      key: 'site_name',
      label: 'Site',
      render: (val) => <span style={{ fontSize: '13px', color: '#64748b' }}>{val || 'General Site'}</span>
    },
    {
      key: 'device_count',
      label: 'Devices',
      render: (val) => (
        <span className="items-summary-pill">
          {val || 0} devices
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`badge badge-project-${val === 'active' ? 'progress' : val}`}>
          {val.charAt(0).toUpperCase() + val.slice(1).replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'start_date',
      label: 'Start Date',
      render: (val) => (
        <span className="relative-date" title={new Date(val).toLocaleDateString()}>
          {formatRelativeTime(val)}
        </span>
      )
    },
    {
      key: 'completion',
      label: 'Completion %',
      render: (val, row) => {
        const progress = row.status === 'completed' ? 100 : (row.status === 'planning' ? 10 : 65);
        return (
          <div className="progress-bar-container">
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, minWidth: '30px' }}>{progress}%</span>
          </div>
        );
      }
    }
  ];

  if (!loading && data.length === 0) {
    return (
      <EmptyState 
        icon={Box}
        title="No projects created"
        description="Create projects to manage hardware installations, maintenance cycles, and team assignments."
        actionLabel="Start New Project"
        onAction={openCreate}
      />
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Coordinate site installations and fleet management</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="view-toggle-bar">
          <button className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
            <List size={16} /> List
          </button>
          <button className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>
            <LayoutGrid size={16} /> Kanban
          </button>
        </div>
        <div className="record-count">{filteredData.length} projects</div>
      </div>

      {viewMode === 'list' ? (
        <>
          <div className="filter-bar">
            <div className="filter-left">
              <div className="search-container">
                <Search className="search-icon" size={16} />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search by project name or customer…" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="filter-chips">
                <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="All">Status: All</option>
                  <option value="planning">Planning</option>
                  <option value="active">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Complete</option>
                </select>
              </div>
            </div>
          </div>

          <DataTable 
            columns={columns} 
            data={filteredData}
            onRowClick={(row) => navigate(`/projects/${row.project_id}`)}
            actions={(row) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-icon" title="View Details" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${row.project_id}`); }}>
                  <ExternalLink size={16} />
                </button>
                <button className="btn-icon" title="Archive" onClick={(e) => e.stopPropagation()}>
                  <Archive size={16} />
                </button>
              </div>
            )}
          />
        </>
      ) : (
        <div className="kanban-board">
          {KANBAN_COLUMNS.map(col => {
            const projects = filteredData.filter(p => p.status === col.id);
            return (
              <div key={col.id} className="kanban-column">
                <div className="kanban-column-header">
                  <span className="kanban-column-title">{col.label}</span>
                  <span className="kanban-count">{projects.length}</span>
                </div>
                <div className="kanban-cards">
                  {projects.map(p => (
                    <div key={p.project_id} className="kanban-card" onClick={() => navigate(`/projects/${p.project_id}`)}>
                      <div className="kanban-card-title">{p.project_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>{p.customer_name}</div>
                      
                      <div className="progress-bar-bg" style={{ marginBottom: '8px' }}>
                        <div className="progress-bar-fill" style={{ width: p.status === 'completed' ? '100%' : '65%' }}></div>
                      </div>

                      <div className="kanban-card-footer">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                          <Box size={12} /> {p.device_count || 0}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {formatRelativeTime(p.start_date)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#cbd5e1', fontSize: '12px', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                      No projects here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Project' : 'New Installation Project'} width="640px" error={error}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create Project'}</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Project Name *</label>
            <input className="form-input" value={form.project_name} onChange={e => setForm({...form, project_name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Customer (Optional)</label>
            <select className="form-select" value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})}>
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.customer_name} ({c.customer_id.substring(0, 8)})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="planning">Planning</option>
              <option value="active">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Complete</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input type="date" className="form-input" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Estimated End Date</label>
            <input type="date" className="form-input" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Project Description</label>
            <textarea className="form-input" rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe project scope and hardware requirements..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}

