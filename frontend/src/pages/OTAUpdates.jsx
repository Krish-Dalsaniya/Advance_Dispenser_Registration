import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHeaderAction } from '../context/HeaderActionContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { 
  Rocket, Search, Send, Clock, CheckCircle2, XCircle, 
  RefreshCw, Loader2, Copy, AlertTriangle, ChevronRight,
  Monitor, Building2, Layers, Cpu, Activity
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

function parseVersion(raw) {
  if (!raw) return 'v?.?.?';
  const parts = raw.split('-');
  return parts.find(p => p.startsWith('v')) || 'v0.0.0';
}

export default function OTAUpdatesPage() {
  const { apiFetch } = useAuth();
  const { setAction } = useHeaderAction();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [versions, setVersions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ device_id: '', to_firmware_id: '', notes: '' });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modelFilter, setModelFilter] = useState('All');

  useEffect(() => { load(); loadDevices(); loadVersions(); }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/ota-updates');
      if (res.ok) setData(await res.json());
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadDevices = async () => {
    try {
      const res = await apiFetch('/api/devices');
      if (res.ok) setDevices(await res.json());
    } catch(e) { console.error(e); }
  };

  const loadVersions = async () => {
    try {
      const res = await apiFetch('/api/firmware-versions');
      if (res.ok) {
        const all = await res.json();
        setVersions(all.filter(v => v.is_stable));
      }
    } catch(e) { console.error(e); }
  };

  const openCreate = useCallback(() => {
    setForm({ device_id: '', to_firmware_id: '', notes: '' });
    setError('');
    setModal(true);
  }, []);

  useEffect(() => {
    setAction(
      <button className="btn btn-primary" onClick={openCreate}>
        <Rocket size={16} /> Schedule Update
      </button>
    );
    return () => setAction(null);
  }, [setAction, openCreate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/ota-updates', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setModal(false);
        load();
      }
    } catch (err) { setError(err.message); }
  };

  const filteredData = useMemo(() => {
    return data.filter(u => {
      const searchStr = `${u.serial_number} ${u.target_version} ${u.customer_name} ${u.site_name}`.toLowerCase();
      const matchesSearch = !search || searchStr.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
      const matchesModel = modelFilter === 'All' || u.model_name === modelFilter;
      return matchesSearch && matchesStatus && matchesModel;
    });
  }, [data, search, statusFilter, modelFilter]);

  const stats = useMemo(() => {
    return {
      total: data.length,
      success: data.filter(u => u.status === 'success').length,
      failed: data.filter(u => u.status === 'failed' || u.status === 'pending').length
    };
  }, [data]);

  const columns = [
    {
      key: 'ota_update_id',
      label: 'Update ID',
      render: (val) => (
        <div className="uuid-pill" onClick={() => navigator.clipboard.writeText(val)} title="Click to copy ID">
          {val.substring(0, 8)}…
          <Copy size={10} className="copy-icon" />
        </div>
      )
    },
    {
      key: 'serial_number',
      label: 'Device & Model',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{val}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{row.model_name}</div>
        </div>
      )
    },
    {
      key: 'customer_name',
      label: 'Customer / Site',
      render: (val, row) => (
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          {val} <span style={{ color: 'var(--color-border)' }}>·</span> {row.site_name}
        </div>
      )
    },
    {
      key: 'target_version',
      label: 'Firmware',
      render: (val) => (
        <div style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{parseVersion(val)}</div>
      )
    },
    {
      key: 'triggered_at',
      label: 'Scheduled At',
      render: (val) => (
        <span className="relative-date" title={new Date(val).toLocaleString()}>
          {formatRelativeTime(val)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        let badgeClass = 'badge-ota-pending';
        let icon = null;
        
        if (val === 'in_progress') {
          badgeClass = 'badge-ota-progress';
          icon = <Loader2 size={12} className="spinner-ota" />;
        } else if (val === 'success') {
          badgeClass = 'badge-ota-success';
          icon = <CheckCircle2 size={12} style={{ marginRight: '6px' }} />;
        } else if (val === 'failed') {
          badgeClass = 'badge-ota-failed';
          icon = <XCircle size={12} style={{ marginRight: '6px' }} />;
        } else {
          icon = <Clock size={12} style={{ marginRight: '6px' }} />;
        }

        return (
          <span className={`badge ${badgeClass}`} style={{ display: 'flex', alignItems: 'center', width: 'fit-content' }}>
            {icon}
            {val.replace('_', ' ').charAt(0).toUpperCase() + val.replace('_', ' ').slice(1)}
          </span>
        );
      }
    }
  ];

  if (!loading && data.length === 0) {
    return (
      <EmptyState 
        icon={Rocket}
        title="No OTA updates scheduled"
        description="Schedule and monitor Over-The-Air firmware deployments across your global dispenser fleet"
        actionLabel="Schedule First Update"
        onAction={openCreate}
      />
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">OTA Updates</h1>
          <p className="page-subtitle">Monitor and schedule remote firmware deployments</p>
        </div>
      </div>

      <div className="ota-summary-banner">
        <div className="ota-stat-box">
          <span className="ota-stat-label">Total Deployments</span>
          <span className="ota-stat-value">{stats.total}</span>
        </div>
        <div style={{ width: '1px', background: 'var(--color-border)' }}></div>
        <div className="ota-stat-box">
          <span className="ota-stat-label">Successful</span>
          <span className="ota-stat-value" style={{ color: 'var(--color-success)' }}>{stats.success}</span>
        </div>
        <div style={{ width: '1px', background: 'var(--color-border)' }}></div>
        <div className="ota-stat-box">
          <span className="ota-stat-label">Failed / Pending</span>
          <span className="ota-stat-value" style={{ color: 'var(--color-danger)' }}>{stats.failed}</span>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-left">
          <div className="search-container">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by device, version, or site…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-chips">
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">Status: All</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        <div className="record-count">{filteredData.length} updates</div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredData}
        expandable
        renderExpansion={(row) => {
          const steps = [
            { label: 'Queued', status: row.status === 'pending' || row.status === 'in_progress' || row.status === 'success' ? 'completed' : 'pending' },
            { label: 'Sent', status: row.status === 'in_progress' || row.status === 'success' ? 'completed' : row.status === 'failed' ? 'failed' : 'pending' },
            { label: 'Installing', status: row.status === 'success' ? 'completed' : row.status === 'in_progress' ? 'active' : row.status === 'failed' ? 'failed' : 'pending' },
            { label: 'Complete', status: row.status === 'success' ? 'completed' : row.status === 'failed' ? 'failed' : 'pending' }
          ];

          return (
            <div className="timeline-container">
              <div className="step-indicator">
                {steps.map((step, idx) => (
                  <div key={idx} className={`step-item ${step.status}`}>
                    <div className="step-dot">
                      {step.status === 'completed' ? <CheckCircle2 size={14} /> : 
                       step.status === 'active' ? <Loader2 size={14} className="spinner-ota" /> :
                       step.status === 'failed' ? <XCircle size={14} /> : idx + 1}
                    </div>
                    <span className="step-label">{step.label}</span>
                  </div>
                ))}
              </div>

              {row.status === 'failed' && (
                <div className="ota-error-log">
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <AlertTriangle size={18} color="#a8071a" />
                    <div className="error-message">
                      <strong>Update Failed:</strong> Internal checksum mismatch during verification at block 0x4F2A. 
                      Please verify hardware compatibility or retry.
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigator.clipboard.writeText('Internal checksum mismatch during verification at block 0x4F2A')}>
                    <Copy size={12} style={{ marginRight: '6px' }} /> Copy log
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                {row.status === 'failed' && (
                  <button className="btn btn-primary btn-sm">
                    <RefreshCw size={14} style={{ marginRight: '6px' }} /> Retry Deployment
                  </button>
                )}
                {row.status === 'pending' && (
                  <button className="btn btn-secondary btn-sm" style={{ color: '#ef4444' }}>
                    <XCircle size={14} style={{ marginRight: '6px' }} /> Cancel Update
                  </button>
                )}
                <button className="btn btn-secondary btn-sm">View Full Log</button>
              </div>
            </div>
          );
        }}
        actions={(row) => null} // Handled in expansion
      />

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Schedule OTA Update" error={error}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Schedule Update</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Target Device</label>
            <select className="form-select" value={form.device_id} onChange={e => setForm({...form, device_id: e.target.value})}>
              <option value="">Select Device</option>
              {devices.map(d => <option key={d.device_id} value={d.device_id}>{d.serial_number} ({d.device_uid?.substring(0, 8) || '—'}…)</option>)}
            </select>
          </div>
          <div className="form-group full-width">
            <label className="form-label">Target Firmware (Stable Only)</label>
            <select className="form-select" value={form.to_firmware_id} onChange={e => setForm({...form, to_firmware_id: e.target.value})}>
              <option value="">Select Version</option>
              {versions.map(v => <option key={v.firmware_version_id} value={v.firmware_version_id}>{parseVersion(v.version_string)} ({v.version_string?.substring(0, 15) || '—'}…)</option>)}
            </select>
          </div>
          <div className="form-group full-width">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Reason for update (e.g., Critical security patch for Flowmeter stability)" />
          </div>
        </div>
      </Modal>
    </div>
  );
}

