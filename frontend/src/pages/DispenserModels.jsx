import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHeaderAction } from '../context/HeaderActionContext';
import Modal from '../components/Modal';
import SlideOver from '../components/SlideOver';
import EmptyState from '../components/EmptyState';
import { 
  Plus, Search, Fuel, Package, Edit2, Trash2, 
  Settings, Zap, Droplet, Monitor, Info, ExternalLink
} from 'lucide-react';

const seriesMatrix = {
  'Nitro':  { type: 'Mini',    fuel: 'DEF',    nozzles: 1, speed: '15 LPM', protocol: 'MODBUS' },
  'Hydro':  { type: 'Mini',    fuel: 'Diesel', nozzles: 1, speed: '40 LPM', protocol: 'MODBUS' },
  'Oxy':    { type: 'Tower',   fuel: 'DEF',    nozzles: 2, speed: '15 LPM', protocol: 'ZIGBEE' },
  'Ozone':  { type: 'Tower',   fuel: 'Diesel', nozzles: 2, speed: '80 LPM', protocol: 'ZIGBEE' },
  'Titan':  { type: 'Storage', fuel: 'DEF',    nozzles: 1, speed: '15 LPM', protocol: 'WIFI' },
  'Helium': { type: 'Storage', fuel: 'Diesel', nozzles: 4, speed: '120 LPM', protocol: 'ETHERNET' }
};

const emptyForm = { 
  series_name: '', model_name: '', dispenser_type: '', 
  fuel_type: '', model_description: ''
};

export default function DispenserModelsPage() {
  const { apiFetch } = useAuth();
  const { setAction } = useHeaderAction();
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  
  // Selection & Details
  const [selectedModel, setSelectedModel] = useState(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [fuelFilter, setFuelFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => { load(); loadProducts(); }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/dispenser-models');
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadProducts = async () => {
    try {
      const res = await apiFetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch (e) { console.error(e); }
  };

  const openCreate = useCallback(() => { setForm(emptyForm); setError(''); setEditing(null); setModal(true); }, []);

  useEffect(() => {
    setAction(
      <button className="btn btn-primary" onClick={openCreate}>
        <Plus size={16} /> Add Model
      </button>
    );
    return () => setAction(null);
  }, [setAction, openCreate]);

  const openDetails = (model) => {
    setSelectedModel(model);
    setIsSlideOverOpen(true);
  };

  const openEdit = (e, model) => {
    e.stopPropagation();
    setForm(model);
    setEditing(model.dispenser_model_id);
    setModal(true);
    setIsSlideOverOpen(false);
  };

  const handleDelete = async (e, model) => {
    e.stopPropagation();
    if (!confirm(`Delete model "${model.model_name}"?`)) return;
    await apiFetch(`/api/dispenser-models/${model.dispenser_model_id}`, { method: 'DELETE' });
    if (isSlideOverOpen) setIsSlideOverOpen(false);
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/dispenser-models/${editing}` : '/api/dispenser-models';
      await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setModal(false);
      load();
    } catch (err) { setError(err.message); }
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

  const filteredData = useMemo(() => {
    return data.filter(m => {
      const matchesSearch = !search || m.model_name.toLowerCase().includes(search.toLowerCase());
      const matchesFuel = fuelFilter === 'All' || m.fuel_type === fuelFilter;
      const matchesType = typeFilter === 'All' || m.dispenser_type === typeFilter;
      return matchesSearch && matchesFuel && matchesType;
    });
  }, [data, search, fuelFilter, typeFilter]);

  const modelProducts = useMemo(() => {
    if (!selectedModel) return [];
    return products.filter(p => p.dispenser_model_id === selectedModel.dispenser_model_id);
  }, [products, selectedModel]);

  if (data.length === 0) {
    return (
      <EmptyState 
        icon={Settings}
        title="No dispenser models configured"
        description="Models define the hardware templates used for building physical dispenser products"
        actionLabel="Add First Model"
        onAction={openCreate}
      />
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Dispenser Models</h1>
          <p className="page-subtitle">Configuration templates for various dispenser series</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-left">
          <div className="search-container">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search models…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-chips">
            <select className="filter-select" value={fuelFilter} onChange={e => setFuelFilter(e.target.value)}>
              <option value="All">Fuel Type: All</option>
              <option value="Diesel">Diesel</option>
              <option value="DEF">DEF</option>
            </select>
            <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="All">Type: All</option>
              <option value="Mini">Mini</option>
              <option value="Tower">Tower</option>
              <option value="Storage">Storage</option>
            </select>
          </div>
        </div>
        <div className="record-count">{filteredData.length} models</div>
      </div>

      <div className="model-grid">
        {filteredData.map(model => {
          const specs = seriesMatrix[model.series_name] || {};
          const usageCount = products.filter(p => p.dispenser_model_id === model.dispenser_model_id).length;
          
          return (
            <div key={model.dispenser_model_id} className="model-card" onClick={() => openDetails(model)}>
              <div className="model-card-header">
                <h3 className="model-card-title">{model.model_name}</h3>
                <div className="model-badge-row">
                  <span className={`badge ${model.dispenser_type === 'Mini' ? 'badge-admin' : 'badge-engineer'}`}>
                    {model.dispenser_type}
                  </span>
                  <span className={`badge ${model.fuel_type === 'Diesel' ? 'badge-danger' : 'badge-completed'}`}>
                    {model.fuel_type}
                  </span>
                </div>
              </div>

              <div className="model-card-body">
                <div className="tech-specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Nozzles</span>
                    <span className="spec-value">{specs.nozzles || '—'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Speed</span>
                    <span className="spec-value">{specs.speed || '—'}</span>
                  </div>
                  <div className="spec-item" style={{ gridColumn: 'span 2' }}>
                    <span className="spec-label">Protocol</span>
                    <span className="spec-value">{specs.protocol || '—'}</span>
                  </div>
                </div>
                <div className="model-usage">
                  <Package size={14} color="#64748b" />
                  <span>{usageCount} products build on this</span>
                </div>
              </div>

              <div className="model-card-footer">
                <button className="btn-icon" onClick={(e) => openEdit(e, model)} aria-label="Edit model">
                  <Edit2 size={16} />
                </button>
                <button className="btn-icon" onClick={(e) => handleDelete(e, model)} aria-label="Delete model">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail SlideOver */}
      <SlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        title="Model Specifications"
        width="560px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={(e) => openEdit(e, selectedModel)}>
              <Edit2 size={14} /> Edit Model
            </button>
          </>
        }
      >
        {selectedModel && (
          <div className="model-detail-content">
            <div className="detail-section">
              <div className="detail-section-title">Hardware Architecture</div>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="expansion-field">
                  <span className="expansion-label">Series Name</span>
                  <span className="expansion-value" style={{ fontWeight: 600 }}>{selectedModel.series_name}</span>
                </div>
                <div className="expansion-field">
                  <span className="expansion-label">Chassis Type</span>
                  <span className="expansion-value">{selectedModel.dispenser_type}</span>
                </div>
                <div className="expansion-field">
                  <span className="expansion-label">Fuel Compatibility</span>
                  <span className="expansion-value">{selectedModel.fuel_type}</span>
                </div>
                <div className="expansion-field">
                  <span className="expansion-label">Nozzle Count</span>
                  <span className="expansion-value">{seriesMatrix[selectedModel.series_name]?.nozzles || '—'}</span>
                </div>
              </div>
              <div style={{ marginTop: '20px' }}>
                <span className="expansion-label">Template Description</span>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginTop: '8px' }}>
                  {selectedModel.model_description || 'No detailed description provided for this template.'}
                </p>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Associated Products ({modelProducts.length})</div>
              {modelProducts.length > 0 ? (
                modelProducts.map(product => (
                  <div key={product.product_id} className="linked-item">
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <Zap size={16} color="#0f4c81" />
                      <div className="linked-item-info">
                        <span className="linked-item-title">{product.product_name}</span>
                        <span className="linked-item-sub">{product.product_code}</span>
                      </div>
                    </div>
                    <ExternalLink size={14} color="#94a3b8" />
                  </div>
                ))
              ) : (
                <div className="empty-state-small" style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <Package size={24} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>No active products using this model template.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOver>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Dispenser Model' : 'New Dispenser Model'}
        error={error}
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
            <input className="form-input" value={form.dispenser_type || ''} readOnly style={{ background: '#f8fafc' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Fuel Type (Auto)</label>
            <input className="form-input" value={form.fuel_type || ''} readOnly style={{ background: '#f8fafc' }} />
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

