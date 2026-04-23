import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Eye } from 'lucide-react';

const columns = [
  { key: 'configuration_id', label: 'ID' },
  { key: 'config_name', label: 'Config Name' },
  { key: 'model_name', label: 'Dispenser Model' },
  { key: 'connectivity_type', label: 'Connectivity' },
  { key: 'nozzle_count', label: 'Nozzles' },
  { key: 'mb_firmware_version', label: 'MB Firmware' },
  { key: 'gsm_firmware_version', label: 'GSM Firmware' },
  { key: 'configured_at', label: 'Created', type: 'datetime' },
];

const emptyForm = {
  dispenser_model_id: '',
  config_name: '',
  mb_firmware_id: '',
  gsm_firmware_id: '',
  nozzle_count: 1,
  connectivity_type: '',
  keyboard_format: '',
  config_notes: ''
};

export default function DispenserConfigurationsPage() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState([]);
  const [models, setModels] = useState([]);
  const [mbFirmwares, setMbFirmwares] = useState([]);
  const [gsmFirmwares, setGsmFirmwares] = useState([]);
  
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    load();
    loadDependencies();
  }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/dispenser-configurations');
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadDependencies = async () => {
    try {
      const [modelsRes, mbRes, gsmRes] = await Promise.all([
        apiFetch('/api/dispenser-models'),
        apiFetch('/api/components/motherboard_firmware'),
        apiFetch('/api/components/gsm_firmware')
      ]);

      if (modelsRes.ok) setModels(await modelsRes.json());
      if (mbRes.ok) setMbFirmwares(await mbRes.json());
      if (gsmRes.ok) setGsmFirmwares(await gsmRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const openView = (row) => {
    setViewData(row);
    setViewModal(true);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setModal(true);
  };

  const handleSubmit = async () => {
    try {
      const res = await apiFetch('/api/dispenser-configurations', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setModal(false);
        load();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create configuration');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred');
    }
  };

  const onChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">IoT Configurations</h1>
          <p className="page-subtitle">Manage firmware and feature blueprints for dispenser models</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Configuration</button>
      </div>

      {/* Note: The backend does not currently support EDIT or DELETE for configurations */}
      <DataTable 
        columns={columns} 
        data={data} 
        onView={openView} 
      />

      {/* View Modal */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Configuration Details" width="600px">
        {viewData && (
          <div className="view-details-content">
            <div className="section-title">Configuration Profile</div>
            <div className="detail-row">
              <div className="detail-item">
                <span className="label">Configuration Name</span>
                <span className="value">{viewData.config_name}</span>
              </div>
              <div className="detail-item">
                <span className="label">Dispenser Model</span>
                <span className="value">{viewData.model_name}</span>
              </div>
              <div className="detail-item">
                <span className="label">Connectivity</span>
                <span className="value">{viewData.connectivity_type || 'None'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Configuration ID</span>
                <span className="value">{viewData.configuration_id}</span>
              </div>
            </div>

            <div className="section-title" style={{ marginTop: 24 }}>System Specifications</div>
            <div className="detail-row">
              <div className="detail-item">
                <span className="label">Nozzle Count</span>
                <span className="value">{viewData.nozzle_count}</span>
              </div>
              <div className="detail-item">
                <span className="label">Keyboard Format</span>
                <span className="value">{viewData.keyboard_format || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="label">MB Firmware</span>
                <span className="value">{viewData.mb_firmware_version || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="label">GSM Firmware</span>
                <span className="value">{viewData.gsm_firmware_version || 'N/A'}</span>
              </div>
            </div>
            
            {viewData.config_notes && (
              <>
                <div className="section-title" style={{ marginTop: 24 }}>Notes</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  {viewData.config_notes}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal 
        isOpen={modal} 
        onClose={() => setModal(false)} 
        title="New IoT Configuration"
        width="700px"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Create</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Configuration Name *</label>
            <input 
              className="form-input" 
              placeholder="e.g. Dual Nozzle WiFi Config v1.2"
              value={form.config_name} 
              onChange={e => onChange('config_name', e.target.value)} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Target Dispenser Model *</label>
            <select className="form-select" value={form.dispenser_model_id} onChange={e => onChange('dispenser_model_id', e.target.value)} required>
              <option value="">Select Model</option>
              {models.map(m => <option key={m.dispenser_model_id} value={m.dispenser_model_id}>{m.model_name} {m.fuel_type ? `(${m.fuel_type})` : ''}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nozzle Count</label>
            <input 
              className="form-input" 
              type="number" 
              min="1" 
              value={form.nozzle_count} 
              onChange={e => onChange('nozzle_count', parseInt(e.target.value))} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Motherboard Firmware</label>
            <select className="form-select" value={form.mb_firmware_id} onChange={e => onChange('mb_firmware_id', e.target.value)}>
              <option value="">Not Assigned</option>
              {mbFirmwares.map(f => (
                <option key={f.mb_firmware_id} value={f.mb_firmware_id}>
                  {f.version_no} - {f.firmware_description}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">GSM Firmware</label>
            <select className="form-select" value={form.gsm_firmware_id} onChange={e => onChange('gsm_firmware_id', e.target.value)}>
              <option value="">Not Assigned</option>
              {gsmFirmwares.map(f => (
                <option key={f.gsm_firmware_id} value={f.gsm_firmware_id}>
                  {f.version_no} - {f.firmware_description}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Connectivity</label>
            <select className="form-select" value={form.connectivity_type} onChange={e => onChange('connectivity_type', e.target.value)}>
              <option value="">Select Connectivity</option>
              <option value="GSM">GSM</option>
              <option value="WiFi">WiFi</option>
              <option value="Ethernet">Ethernet</option>
              <option value="None">None</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Keyboard Format</label>
            <select className="form-select" value={form.keyboard_format} onChange={e => onChange('keyboard_format', e.target.value)}>
              <option value="">Select Format</option>
              <option value="Numeric">Numeric</option>
              <option value="Alphanumeric">Alphanumeric</option>
              <option value="Touchscreen">Touchscreen</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label className="form-label">Configuration Notes</label>
            <textarea 
              className="form-textarea" 
              placeholder="Internal notes or blueprint description..."
              value={form.config_notes} 
              onChange={e => onChange('config_notes', e.target.value)} 
            />
          </div>
        </div>
      </Modal>

      <style>{`
        .view-details-content { padding: 8px; }
        .section-title { font-size: 0.85rem; font-weight: 600; color: var(--accent-blue-light); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 16px; }
        .detail-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
        .detail-item { display: flex; flex-direction: column; gap: 4px; }
        .detail-item .label { font-size: 0.75rem; color: var(--text-muted); }
        .detail-item .value { font-size: 0.9rem; color: var(--text-main); font-weight: 500; }
      `}</style>
    </div>
  );
}
