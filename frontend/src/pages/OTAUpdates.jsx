import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Send } from 'lucide-react';

const columns = [
  { key: 'serial_number', label: 'Device Serial' },
  { key: 'device_uid', label: 'Device UID' },
  { key: 'target_version', label: 'Target Version' },
  { key: 'status', label: 'Status', badge: true },
  { key: 'triggered_at', label: 'Scheduled At', type: 'datetime' },
];

export default function OTAUpdatesPage() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [versions, setVersions] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ device_id: '', to_firmware_id: '', notes: '' });
  const [error, setError] = useState('');

  useEffect(() => { load(); loadDevices(); loadVersions(); }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/ota-updates');
      if (res.ok) setData(await res.json());
    } catch(e) { console.error(e); }
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

  const handleSubmit = async () => {
    try {
      const res = await apiFetch('/api/ota-updates', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setModal(false);
        load();
      }
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">OTA Updates</h1>
          <p className="page-subtitle">Schedule and track Over-The-Air firmware updates</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({device_id:'', to_firmware_id:'', notes:''}); setModal(true); }}>
          <Send size={16} /> Push Update
        </button>
      </div>

      <DataTable columns={columns} data={data} />

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
              {devices.map(d => <option key={d.device_id} value={d.device_id}>{d.serial_number} ({d.device_uid})</option>)}
            </select>
          </div>
          <div className="form-group full-width">
            <label className="form-label">Target Firmware (Stable Only)</label>
            <select className="form-select" value={form.to_firmware_id} onChange={e => setForm({...form, to_firmware_id: e.target.value})}>
              <option value="">Select Version</option>
              {versions.map(v => <option key={v.firmware_version_id} value={v.firmware_version_id}>{v.version_string}</option>)}
            </select>
          </div>
          <div className="form-group full-width">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Why is this update being pushed?" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
