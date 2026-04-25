import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHeaderAction } from '../context/HeaderActionContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SlideOver from '../components/SlideOver';
import EmptyState from '../components/EmptyState';
import { 
  Plus, Search, Layers, CheckCircle, XCircle, Info, 
  ExternalLink, Trash2, Rocket, Clock, Box, ShieldCheck,
  Cpu, Activity
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
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

function parseVersionString(raw) {
  if (!raw) return { version: 'v?.?.?', hardware: 'Unknown', protocol: 'Unknown', config: 'Unknown', hash: 'Unknown' };
  
  // Example: IOT-1NZ-21L-ETHERNET-GSM_4G-GPS-MODBUS_RS485-5x5-v1.0.0-e94ea320
  const parts = raw.split('-');
  
  // v1.0.0 is usually near the end
  const version = parts.find(p => p.startsWith('v')) || 'v0.0.0';
  const hash = parts[parts.length - 1] || '—';
  const nozzlesPart = parts.find(p => p.endsWith('NZ')) || '0NZ';
  const speedPart = parts.find(p => p.endsWith('L')) || '0L';
  const configPart = parts.find(p => p.includes('x')) || '—';
  
  // Connectivity (ETHERNET, GSM, GPS, etc)
  const connectivity = parts.filter(p => 
    ['ETHERNET', 'WIFI', 'GSM_4G', 'GSM_2G', 'GPS', 'BT'].includes(p)
  ).map(p => p.replace('_', ' ')).join(' + ');
  
  // Protocol (MODBUS, ZIGBEE, etc)
  const protocol = parts.find(p => p.includes('MODBUS') || p.includes('ZIGBEE') || p.includes('WIFI'))?.replace('_', ' ') || 'Internal';

  return {
    version,
    hardware: `${nozzlesPart.replace('NZ', '')}-Nozzle · ${speedPart} · ${connectivity}`,
    protocol,
    config: configPart,
    hash
  };
}

export default function FirmwareVersionsPage() {
  const { apiFetch } = useAuth();
  const { setAction } = useHeaderAction();
  const navigate = useNavigate();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Details
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/firmware-versions');
      if (res.ok) setData(await res.json());
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openCreate = useCallback(() => {
    // Navigate to OTA or show a builder modal - for now, just a placeholder or navigate to OTA
    navigate('/ota-updates');
  }, [navigate]);

  useEffect(() => {
    setAction(
      <button className="btn btn-primary" onClick={openCreate}>
        <Plus size={16} /> New Build
      </button>
    );
    return () => setAction(null);
  }, [setAction, openCreate]);

  const handleMarkStable = async (e, row) => {
    e.stopPropagation();
    if (row.is_stable) return;
    if (!confirm(`Mark version ${row.version_string} as STABLE?`)) return;
    
    try {
      const res = await apiFetch(`/api/firmware-versions/${row.firmware_version_id}/stable`, { method: 'PATCH' });
      if (res.ok) load();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (e, row) => {
    e.stopPropagation();
    if (!confirm(`Delete this firmware build?`)) return;
    await apiFetch(`/api/firmware-versions/${row.firmware_version_id}`, { method: 'DELETE' });
    load();
  };

  const filteredData = useMemo(() => {
    return data.filter(b => {
      const parsed = parseVersionString(b.version_string);
      const searchStr = `${b.version_string} ${b.product_name} ${parsed.version} ${parsed.hash}`.toLowerCase();
      const matchesSearch = !search || searchStr.includes(search.toLowerCase());
      const matchesProduct = productFilter === 'All' || b.product_name === productFilter;
      const matchesStatus = statusFilter === 'All' || 
        (statusFilter === 'Stable' && b.is_stable) || 
        (statusFilter === 'Inactive' && !b.is_stable);
      return matchesSearch && matchesProduct && matchesStatus;
    });
  }, [data, search, productFilter, statusFilter]);

  const productList = useMemo(() => {
    return [...new Set(data.map(b => b.product_name))];
  }, [data]);

  const columns = [
    {
      key: 'version_string',
      label: 'Version & Architecture',
      render: (val) => {
        const p = parseVersionString(val);
        return (
          <div className="firmware-version-cell">
            <div className="firmware-title">{p.version}</div>
            <div className="firmware-hw-row">
              {p.hardware}
            </div>
            <div className="firmware-meta-row">
              <span className="firmware-protocol">{p.protocol}</span>
              <span className="firmware-dot"></span>
              <span className="firmware-config">Config: {p.config}</span>
              <span className="firmware-dot"></span>
              <span className="firmware-hash">#{p.hash}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'product_name',
      label: 'Target Product',
      render: (val) => (
        <Link to="/products" className="product-name-cell" style={{ fontSize: '13px' }}>
          {val}
        </Link>
      )
    },
    {
      key: 'nozzle_count',
      label: 'Nozzles',
      render: (val) => <div style={{ textAlign: 'center', fontWeight: 600 }}>{val}</div>
    },
    {
      key: 'dispensing_speed',
      label: 'Speed',
      render: (val) => <div style={{ fontWeight: 500 }}>{val} <span style={{ fontSize: '10px', color: '#64748b' }}>L/min</span></div>
    },
    {
      key: 'is_stable',
      label: 'Release Status',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className={`badge ${val ? 'badge-stable' : 'badge-inactive'}`}>
            {val ? 'Stable' : 'Inactive'}
          </span>
          {!val && (
            <span className="info-tooltip-trigger" title="Inactive builds are drafts or deprecated versions not yet approved for OTA deployment.">
              <Info size={12} />
            </span>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Build Date',
      render: (val) => (
        <span className="relative-date" title={new Date(val).toLocaleString()}>
          {formatRelativeTime(val)}
        </span>
      )
    }
  ];

  if (!loading && data.length === 0) {
    return (
      <EmptyState 
        icon={Layers}
        title="No firmware builds yet"
        description="Firmware builds are automatically generated when new hardware configurations are registered"
        actionLabel="Go to OTA Updates"
        onAction={() => navigate('/ota-updates')}
      />
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Firmware Builds</h1>
          <p className="page-subtitle">Deployment-ready binary builds and release notes</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-left">
          <div className="search-container">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by version, product, or hash…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-chips">
            <select className="filter-select" value={productFilter} onChange={e => setProductFilter(e.target.value)}>
              <option value="All">Product: All</option>
              {productList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">Status: All</option>
              <option value="Stable">Stable Only</option>
              <option value="Inactive">Inactive/Drafts</option>
            </select>
          </div>
        </div>
        <div className="record-count">{filteredData.length} builds</div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{error}</div>}

      <DataTable 
        columns={columns} 
        data={filteredData}
        expandable
        renderExpansion={(row) => (
          <div className="expansion-grid">
            <div className="expansion-section">
              <div className="expansion-section-title">Raw Build Signature</div>
              <code style={{ display: 'block', padding: '12px', background: '#f1f5f9', borderRadius: '8px', fontSize: '11px', wordBreak: 'break-all', color: '#475569' }}>
                {row.version_string}
              </code>
            </div>
            <div className="expansion-section">
              <div className="expansion-section-title">Engineering Actions</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {!row.is_stable && (
                  <button className="btn btn-primary btn-sm" onClick={(e) => handleMarkStable(e, row)}>
                    <ShieldCheck size={14} style={{ marginRight: '6px' }} /> Mark as Stable
                  </button>
                )}
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/ota-updates')}>
                  <Rocket size={14} style={{ marginRight: '6px' }} /> Deploy OTA
                </button>
                <button className="btn-icon" style={{ marginLeft: 'auto', color: '#ef4444' }} onClick={(e) => handleDelete(e, row)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      />

      <SlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        title="Build Specifications"
        width="560px"
      >
        {selectedBuild && (
          <div className="build-detail-content">
            <div className="detail-section">
              <div className="detail-section-title">Version Information</div>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="expansion-field">
                  <span className="expansion-label">Release Version</span>
                  <span className="expansion-value" style={{ fontSize: '18px', fontWeight: 600 }}>{parseVersionString(selectedBuild.version_string).version}</span>
                </div>
                <div className="expansion-field">
                  <span className="expansion-label">Build Integrity Hash</span>
                  <code style={{ fontSize: '13px' }}>{parseVersionString(selectedBuild.version_string).hash}</code>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}

