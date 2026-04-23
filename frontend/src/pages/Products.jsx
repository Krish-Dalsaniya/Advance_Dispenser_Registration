import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Eye } from 'lucide-react';

const columns = [
  { key: 'product_id', label: 'ID' },
  { key: 'product_name', label: 'Product Name' },
  { key: 'model_name', label: 'Model' },
  { key: 'dispenser_type', label: 'Type' },
  { key: 'fuel_type', label: 'Fuel' },
  { key: 'production_serial_no', label: 'Serial No' },
  { key: 'manufacturing_batch', label: 'Batch' },
  { key: 'entry_by_username', label: 'Created By' },
  { key: 'entry_date_time', label: 'Created', type: 'datetime' },
];

const COMPONENT_GROUPS = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'electronics', label: 'Core Electronics' },
  { id: 'fluid', label: 'Fluid Path' },
  { id: 'peripherals', label: 'Peripherals' },
  { id: 'sensors', label: 'Sensors & Safety' },
];

const COMPONENT_FIELDS = [
  { key: 'motherboard_id', label: 'Motherboard', type: 'motherboard', category: 'electronics', sCol: 'production_serial_no' },
  { key: 'gsm_id', label: 'GSM Module', type: 'gsm', category: 'electronics', sCol: 'production_serial_no' },
  { key: 'back_panel_pcb_id', label: 'Back Panel PCB', type: 'back_panel_pcb', category: 'electronics', sCol: 'pcb_serial_no' },
  { key: 'smps_id', label: 'SMPS', type: 'smps', category: 'electronics', sCol: 'smps_serial_no' },
  { key: 'transformer_id', label: 'Transformer', type: 'transformer', category: 'electronics', sCol: 'transformer_serial_no' },
  { key: 'relay_box_id', label: 'Relay Box', type: 'relay_box', category: 'electronics', sCol: 'relay_box_serial_no' },
  { key: 'emi_emc_filter_id', label: 'EMI/EMC Filter', type: 'emi_emc_filter', category: 'electronics', sCol: 'filter_serial_no' },
  { key: 'pump_id', label: 'Pump', type: 'pump', category: 'fluid', sCol: 'pump_serial_no' },
  { key: 'solenoid_valve_id', label: 'Solenoid Valve', type: 'solenoid_valve', category: 'fluid', sCol: 'solenoid_serial_no' },
  { key: 'flowmeter_id', label: 'Flowmeter', type: 'flowmeter', category: 'fluid', sCol: 'flowmeter_serial_no' },
  { key: 'nozzle_id', label: 'Nozzle', type: 'nozzle', category: 'fluid', sCol: 'nozzle_serial_no' },
  { key: 'filter_id', label: 'Filter', type: 'filter', category: 'fluid', sCol: 'filter_serial_no' },
  { key: 'printer_id', label: 'Printer', type: 'printer', category: 'peripherals', sCol: 'printer_serial_no' },
  { key: 'battery_id', label: 'Battery', type: 'battery', category: 'peripherals', sCol: 'battery_serial_no' },
  { key: 'speaker_id', label: 'Speaker', type: 'speaker', category: 'peripherals', sCol: 'speaker_serial_no' },
  { key: 'amplifier_id', label: 'Amplifier', type: 'amplifier', category: 'peripherals', sCol: 'amplifier_serial_no' },
  { key: 'dc_meter_id', label: 'DC Meter', type: 'dc_meter', category: 'peripherals', sCol: 'dc_motor_serial_no' },
  { key: 'tank_sensor_id', label: 'Tank Sensor', type: 'tank_sensor', category: 'sensors', sCol: 'tank_sensor_serial_no' },
  { key: 'quality_sensor_id', label: 'Quality Sensor', type: 'quality_sensor', category: 'sensors', sCol: 'quality_sensor_serial_no' },
  { key: 'rccb_id', label: 'RCCB', type: 'rccb', category: 'sensors', sCol: 'rccb_serial_no' },
  { key: 'spd_id', label: 'SPD', type: 'spd', category: 'sensors', sCol: 'spd_serial_no' },
  { key: 'pressure_sensor_id', label: 'Pressure Sensor', type: 'pressure_sensor', category: 'sensors', sCol: 'pressure_sensor_serial_no' },
];

export default function ProductsPage() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState([]);
  const [models, setModels] = useState([]);
  const [components, setComponents] = useState({});
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('basic');

  useEffect(() => { 
    load(); 
    loadModels();
    loadComponents();
  }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/products');
      if (res.ok) setData(await res.json());
    } catch(e) { console.error(e); }
  };

  const loadModels = async () => {
    try {
      const res = await apiFetch('/api/dispenser-models');
      if (res.ok) setModels(await res.json());
    } catch(e) { console.error(e); }
  };



  const loadComponents = async () => {
    const types = [...new Set(COMPONENT_FIELDS.map(f => f.type))];
    const newComponents = {};
    for (const type of types) {
      try {
        const res = await apiFetch(`/api/components/${type}`);
        if (res.ok) newComponents[type] = await res.json();
      } catch (e) {
        console.error(`Error loading ${type}:`, e);
      }
    }
    setComponents(newComponents);
  };

  const openView = async (row) => {
    try {
      const res = await apiFetch(`/api/products/${row.product_id}`);
      if (res.ok) {
        setViewData(await res.json());
        setViewModal(true);
      }
    } catch(e) { console.error(e); }
  };

  const openCreate = () => {
    setForm({ product_name: '', product_description: '', dispenser_model_id: '', production_serial_no: '', manufacturing_batch: '' });
    setError('');
    setEditing(null);
    setActiveFormTab('basic');
    setModal(true);
  };

  const openEdit = (row) => { 
    setForm(row); 
    setError('');
    setEditing(row.product_id); 
    setActiveFormTab('basic');
    setModal(true); 
  };

  const handleDelete = async (row) => {
    if (!confirm(`Delete product "${row.product_name}"?`)) return;
    await apiFetch(`/api/products/${row.product_id}`, { method: 'DELETE' });
    load();
  };

  const handleSubmit = async () => {
    try {
      const url = editing ? `/api/products/${editing}` : '/api/products';
      await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setModal(false);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const onChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const bomFields = [
    { label: 'Motherboard', key: 'mb_serial' },
    { label: 'GSM Module', key: 'gsm_serial' },
    { label: 'Pump', key: 'pump_serial' },
    { label: 'Solenoid Valve', key: 'solenoid_serial' },
    { label: 'Flowmeter', key: 'flowmeter_serial' },
    { label: 'Nozzle', key: 'nozzle_serial' },
    { label: 'Filter', key: 'filter_serial' },
    { label: 'SMPS', key: 'smps_serial' },
    { label: 'Relay Box', key: 'relay_serial' },
    { label: 'Transformer', key: 'transformer_serial' },
    { label: 'EMI/EMC Filter', key: 'emi_serial' },
    { label: 'Printer', key: 'printer_serial' },
    { label: 'Battery', key: 'battery_serial' },
    { label: 'Speaker', key: 'speaker_serial' },
    { label: 'Amplifier', key: 'amplifier_serial' },
    { label: 'Tank Sensor', key: 'tank_sensor_serial' },
    { label: 'Quality Sensor', key: 'quality_sensor_serial' },
    { label: 'RCCB', key: 'rccb_serial' },
    { label: 'SPD', key: 'spd_serial' },
    { label: 'Back Panel PCB', key: 'back_panel_serial' },
    { label: 'DC Meter', key: 'dc_meter_serial' },
    { label: 'Pressure Sensor', key: 'pressure_sensor_serial' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Assembled dispenser product inventory</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Product</button>
      </div>

      <DataTable columns={columns} data={data} onView={openView} onEdit={openEdit} onDelete={handleDelete} />

      {/* View Modal */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Product Details" width="800px">
        {viewData && (
          <div className="view-details-content">
            <div className="section-title">General Information</div>
            <div className="detail-row">
              <div className="detail-item">
                <span className="label">Product Name</span>
                <span className="value">{viewData.product_name}</span>
              </div>
              <div className="detail-item">
                <span className="label">Model</span>
                <span className="value">{viewData.model_name} ({viewData.fuel_type})</span>
              </div>
              <div className="detail-item">
                <span className="label">Serial Number</span>
                <span className="value">{viewData.production_serial_no}</span>
              </div>
              <div className="detail-item">
                <span className="label">Batch</span>
                <span className="value">{viewData.manufacturing_batch}</span>
              </div>
            </div>

            <div className="section-title" style={{ marginTop: 24 }}>Bill of Materials (BOM)</div>
            <div className="bom-grid">
              {bomFields.map(field => (
                <div key={field.key} className="bom-item">
                  <span className="bom-label">{field.label}</span>
                  <span className={`bom-value ${viewData[field.key] ? '' : 'missing'}`}>
                    {viewData[field.key] || 'Not Assigned'}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: 24 }}>
              {viewData.features?.length > 0 && (
                <div>
                  <div className="section-title">Features</div>
                  <div className="list-items">
                    {viewData.features.map(f => (
                      <div key={f.feature_id} className="inventory-item">
                        <span className="item-name">{f.feature_name}</span>
                        <span className="item-desc">{f.feature_description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewData.specifications?.length > 0 && (
                <div>
                  <div className="section-title">Specifications</div>
                  <div className="list-items">
                    {viewData.specifications.map(s => (
                      <div key={s.spec_id} className="inventory-item">
                        <span className="item-name">{s.spec_name}</span>
                        <span className="item-count">{s.spec_value} {s.spec_unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={modal} 
        onClose={() => setModal(false)} 
        title={editing ? 'Edit Product' : 'New Product Assembly'}
        width="850px"
        error={error}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Register Assembly'}</button>
        </>}
      >
        <div className="tabs" style={{ marginBottom: 20 }}>
          {COMPONENT_GROUPS.map(g => (
            <button 
              key={g.id} 
              className={`tab ${activeFormTab === g.id ? 'active' : ''}`}
              onClick={() => setActiveFormTab(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
          {activeFormTab === 'basic' && (
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Product Name *</label>
                <input className="form-input" value={form.product_name || ''} onChange={e => onChange('product_name', e.target.value)} required />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.product_description || ''} onChange={e => onChange('product_description', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Dispenser Model</label>
                <select className="form-select" value={form.dispenser_model_id || ''} onChange={e => onChange('dispenser_model_id', e.target.value)}>
                  <option value="">Select Model</option>
                  {models.map(m => <option key={m.dispenser_model_id} value={m.dispenser_model_id}>{m.model_name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Production Serial No</label>
                <input className="form-input" placeholder="e.g. SN-DISP-2025-001" value={form.production_serial_no || ''} onChange={e => onChange('production_serial_no', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Manufacturing Date</label>
                <input className="form-input" type="datetime-local" value={form.manufacturing_date_time || ''} onChange={e => onChange('manufacturing_date_time', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Batch</label>
                <input className="form-input" value={form.manufacturing_batch || ''} onChange={e => onChange('manufacturing_batch', e.target.value)} />
              </div>
            </div>
          )}

          {COMPONENT_GROUPS.slice(1).map(group => (
            activeFormTab === group.id && (
              <div key={group.id} className="form-grid">
                {COMPONENT_FIELDS.filter(f => f.category === group.id).map(field => (
                  <div key={field.key} className="form-group">
                    <label className="form-label">{field.label}</label>
                    <select 
                      className="form-select" 
                      value={form[field.key] || ''} 
                      onChange={e => onChange(field.key, e.target.value)}
                    >
                      <option value="">Not Assigned</option>
                      {(components[field.type] || []).map(c => {
                        const pk = Object.keys(c).find(k => k.includes('_id'));
                        return (
                          <option key={c[pk]} value={c[pk]}>
                            {c[field.sCol]} {c.manufacturing_batch ? `(${c.manufacturing_batch})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ))}
              </div>
            )
          ))}
        </div>
      </Modal>

      <style>{`
        .view-details-content { padding: 8px; }
        .section-title { font-size: 0.85rem; font-weight: 600; color: var(--accent-blue-light); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 16px; }
        .detail-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
        .detail-item { display: flex; flex-direction: column; gap: 4px; }
        .detail-item .label { font-size: 0.75rem; color: var(--text-muted); }
        .detail-item .value { font-size: 0.9rem; color: var(--text-main); font-weight: 500; }
        .bom-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .bom-item { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); }
        .bom-label { font-size: 0.8rem; color: var(--text-muted); }
        .bom-value { font-size: 0.85rem; color: var(--accent-blue-light); font-weight: 500; }
        .bom-value.missing { color: #e74c3c; opacity: 0.5; font-style: italic; font-weight: 400; }
        .list-items { display: flex; flex-direction: column; gap: 8px; }
        .item-desc { font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px; }
      `}</style>
    </div>
  );
}
