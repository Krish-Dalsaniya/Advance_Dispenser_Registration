import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Calendar, User, MapPin, CheckCircle2, 
  Clock, AlertCircle, Layers, Plus, Settings, Activity,
  ChevronRight, Box, Cpu
} from 'lucide-react';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { apiFetch } = useAuth();
  
  const [project, setProject] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
    loadProjectDevices();
  }, [id]);

  const loadProject = async () => {
    try {
      const res = await apiFetch(`/api/projects/${id}`);
      if (res.ok) setProject(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadProjectDevices = async () => {
    try {
      const res = await apiFetch(`/api/devices?project_id=${id}`);
      if (res.ok) setDevices(await res.json());
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="page-loading">Loading project details...</div>;
  if (!project) return <div className="page-error">Project not found</div>;

  const progress = project.status === 'completed' ? 100 : (project.status === 'planning' ? 10 : 65);

  return (
    <div className="project-detail-container">
      <div className="detail-header" style={{ marginBottom: '32px' }}>
        <button className="btn-icon" onClick={() => navigate('/projects')} style={{ marginBottom: '16px' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 className="page-title" style={{ margin: 0 }}>{project.project_name}</h1>
              <span className={`badge badge-project-${project.status === 'active' ? 'progress' : project.status}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748b', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> {project.customer_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} /> {project.site_name || 'Generic Site'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} /> Started {new Date(project.start_date).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>PROJECT COMPLETION</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="progress-bar-bg" style={{ width: '120px' }}>
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <span style={{ fontWeight: 700, fontSize: '18px' }}>{progress}%</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
        <div className="detail-main">
          <div className="card" style={{ marginBottom: '32px' }}>
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Activity size={18} color="#0f4c81" />
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Project Milestone Timeline</h2>
            </div>
            <div className="milestone-list" style={{ paddingLeft: '8px' }}>
              <div className="milestone-item">
                <div className="milestone-line">
                  <div className="milestone-dot" style={{ background: '#10b981', borderColor: '#10b981' }}></div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>Project Initiation</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Requirements gathered and stakeholders assigned.</div>
                </div>
              </div>
              <div className="milestone-item">
                <div className="milestone-line">
                  <div className="milestone-dot" style={{ background: '#10b981', borderColor: '#10b981' }}></div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>Hardware Allocation</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Dispenser units assigned to project inventory.</div>
                </div>
              </div>
              <div className="milestone-item">
                <div className="milestone-line">
                  <div className="milestone-dot" style={{ background: '#3b82f6', borderColor: '#3b82f6' }}></div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>Site Installation</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Technicians on-site for hardware setup.</div>
                </div>
              </div>
              <div className="milestone-item">
                <div className="milestone-line" style={{ background: 'transparent' }}>
                  <div className="milestone-dot" style={{ borderColor: '#cbd5e1' }}></div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#94a3b8' }}>Final Compliance Check</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Verification of IoT connectivity and safety protocols.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={18} color="#0f4c81" />
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Registered Hardware</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/devices')}>
                Manage Devices
              </button>
            </div>
            {devices.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                <Box size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                <p>No devices registered for this project yet.</p>
              </div>
            ) : (
              <table className="data-table" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Serial No</th>
                    <th>Model</th>
                    <th>Status</th>
                    <th>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map(device => (
                    <tr key={device.device_id}>
                      <td style={{ fontWeight: 600 }}>{device.serial_number}</td>
                      <td>{device.model_name}</td>
                      <td>
                        <span className={`badge badge-${device.status === 'active' ? 'completed' : 'hold'}`}>
                          {device.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>Just now</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '16px' }}>Project Team</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="avatar-initials">AD</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Admin User</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Project Lead</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="avatar-initials" style={{ background: '#e0f2fe' }}>TC</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Technician C</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Field Engineer</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '16px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <Settings size={14} style={{ marginRight: '8px' }} /> Project Settings
              </button>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <AlertCircle size={14} style={{ marginRight: '8px' }} /> Report Issue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
