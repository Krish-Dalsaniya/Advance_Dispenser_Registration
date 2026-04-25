import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Cpu, Monitor, ShieldCheck, MapPin, 
  Activity, Clock, Layers, Rocket, ExternalLink,
  CheckCircle2, AlertTriangle, Info, Wifi, Signal,
  History, Settings
} from 'lucide-react';

export default function DeviceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { apiFetch } = useAuth();
  
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDevice(); }, [id]);

  const loadDevice = async () => {
    try {
      const res = await apiFetch(`/api/devices/${id}`);
      if (res.ok) setDevice(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="page-loading">Loading device telemetry...</div>;
  if (!device) return <div className="page-error">Device record not found</div>;

  const isOnline = true; // Mocked for UI demonstration
  const hasUpdate = true; // Mocked for UI demonstration

  return (
    <div className="device-detail-container">
      <div className="detail-header" style={{ marginBottom: '32px' }}>
        <button className="btn-icon" onClick={() => navigate('/devices')} style={{ marginBottom: '16px' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className={`status-dot status-dot-${isOnline ? 'online' : 'offline'}`} style={{ width: '12px', height: '12px' }}></div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 className="page-title" style={{ margin: 0 }}>{device.serial_number}</h1>
                <span className={`badge badge-device-${isOnline ? 'online' : 'offline'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                UID: {device.device_uid}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/ota-updates')}>
              <Rocket size={16} style={{ marginRight: '8px' }} /> Push OTA Update
            </button>
            <button className="btn btn-secondary">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
        <div className="detail-main">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
            <div className="card">
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Customer</div>
              <div style={{ fontWeight: 600 }}>{device.customer_name}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{device.company_name}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Site Location</div>
              <div style={{ fontWeight: 600 }}>{device.site_name || 'Main Facility'}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{device.city}, {device.state}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Project</div>
              <div style={{ fontWeight: 600 }}>{device.project_name || 'Default Project'}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>ID: PRJ-001</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '32px' }}>
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={18} color="#0f4c81" />
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Firmware & System</h2>
              </div>
              <span className="badge badge-admin" style={{ fontSize: '11px' }}>Current Version: v1.0.2</span>
            </div>
            {hasUpdate && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <AlertTriangle size={24} color="#1d4ed8" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#1e3a8a' }}>Critical Security Update Available</div>
                  <div style={{ fontSize: '13px', color: '#1e40af' }}>Version v1.1.0 includes fixes for MODBUS stability and GPS locking.</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/ota-updates')}>Update Now</button>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              <div className="expansion-field">
                <span className="expansion-label">MAC Address</span>
                <code className="expansion-value">{device.mac_address || '00:00:00:00:00:00'}</code>
              </div>
              <div className="expansion-field">
                <span className="expansion-label">IoT SIM Number</span>
                <span className="expansion-value">{device.iot_sim_no || '—'}</span>
              </div>
              <div className="expansion-field">
                <span className="expansion-label">Installation Date</span>
                <span className="expansion-value">{new Date(device.installation_date).toLocaleDateString()}</span>
              </div>
              <div className="expansion-field">
                <span className="expansion-label">Last Heartbeat</span>
                <span className="expansion-value" style={{ color: '#10b981', fontWeight: 600 }}>Just now (Success)</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <History size={18} color="#0f4c81" />
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Operational Activity Log</h2>
            </div>
            <div className="device-activity-list">
              <div className="activity-item">
                <div className="activity-icon"><Rocket size={14} /></div>
                <div className="activity-content">
                  <div className="activity-title">Firmware update scheduled (v1.1.0)</div>
                  <div className="activity-time">2 hours ago • by Admin</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon" style={{ color: '#10b981' }}><CheckCircle2 size={14} /></div>
                <div className="activity-content">
                  <div className="activity-title">Periodic health check successful</div>
                  <div className="activity-time">5 hours ago • System</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon"><Settings size={14} /></div>
                <div className="activity-content">
                  <div className="activity-title">Device registered in production</div>
                  <div className="activity-time">Yesterday • by Technician C</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color="#0f4c81" />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Geo-Location</span>
            </div>
            <div style={{ height: '240px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#94a3b8' }}>
              <MapPin size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div style={{ fontSize: '12px', fontWeight: 500 }}>{device.city}, {device.state}</div>
              <div style={{ fontSize: '10px' }}>Lat: 21.1702 • Long: 72.8311</div>
            </div>
            <div style={{ padding: '12px' }}>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                Open in Google Maps
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
