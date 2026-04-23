import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';

const columns = [
  { key: 'series_name', label: 'Series' },
  { key: 'model_name', label: 'Model Name' },
  { key: 'dispenser_type', label: 'Type' },
  { key: 'fuel_type', label: 'Fuel' },
  { key: 'entry_date_time', label: 'Created', type: 'datetime' },
];

const emptyForm = { 
  series_name: '',
  model_name: '', 
  dispenser_type: '', 
  fuel_type: '',
  model_description: ''
};

const seriesMatrix = {
  'Nitro':  { type: 'Mini',    fuel: 'DEF' },
  'Hydro':  { type: 'Mini',    fuel: 'Diesel' },
  'Oxy':    { type: 'Tower',   fuel: 'DEF' },
  'Ozone':  { type: 'Tower',   fuel: 'Diesel' },
  'Titan':  { type: 'Storage', fuel: 'DEF' },
  'Helium': { type: 'Storage', fuel: 'Diesel' }
};

export default function DispenserModelsPage() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState([]);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/dispenser-models');
      setData(await res.json());
    } catch(e) { console.error(e); }
  };

  const openCreate = () => { setForm(emptyForm); setError(''); setEditing(null); setModal(true); };
  const openEdit = (row) => { setForm(row); setError(''); setEditing(row.dispenser_model_id); setModal(true); };

  const handleDelete = async (row) => {
    if (!confirm(`Delete model "${row.model_name}"?`)) return;
    await apiFetch(`/api/dispenser-models/${row.dispenser_model_id}`, { method: 'DELETE' });
    load();
  };

  const handleSubmit = async () => {
    try {
      const url = editing ? `/api/dispenser-models/${editing}` : '/api/dispenser-models';
      await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setModal(false);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const onChange = (key, val) => {
    setForm(f => {
      const updated = { ...f, [key]: val };
      if (key === 'series_name' && seriesMatrix[val]) {
        updated.dispenser_type = seriesMatrix[val].type;
        updated.fuel_type = seriesMatrix[val].fuel;
      }
      return updated;
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dispenser Models</h1>
          <p className="page-subtitle">Manage dispenser model configurations</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Model</button>
      </div>

      <DataTable columns={columns} data={data} onEdit={openEdit} onDelete={handleDelete} />

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Model' : 'New Model'} error={error}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Series *</label>
            <select className="form-select" value={form.series_name || ''} onChange={e => onChange('series_name', e.target.value)} required>
              <option value="">Select Series</option>
              {Object.keys(seriesMatrix).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Model Name *</label>
            <input className="form-input" value={form.model_name || ''} onChange={e => onChange('model_name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Dispenser Type (Auto)</label>
            <input className="form-input" value={form.dispenser_type || ''} readOnly style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Fuel Type (Auto)</label>
            <input className="form-input" value={form.fuel_type || ''} readOnly style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.model_description || ''} onChange={e => onChange('model_description', e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
