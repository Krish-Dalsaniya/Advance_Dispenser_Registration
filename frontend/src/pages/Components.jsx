import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHeaderAction } from '../context/HeaderActionContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Cpu, Activity, Layers, Filter, HardDrive, Settings, Power, Zap, Printer, Battery, Volume2, Shield, Gauge, Radio, FileCode, Box } from 'lucide-react';

const COMPONENT_TYPES = [
  {
    key: 'motherboard', label: 'Motherboard', icon: Cpu,
    columns: [
      { key: 'motherboard_id', label: 'ID', render: (val) => <code style={{ fontSize: '11px', fontWeight: 600 }}>{val}</code> },
      { key: 'mcu_id', label: 'MCU ID' },
      { key: 'esp32_mac_address', label: 'ESP32 MAC' },
      { key: 'production_serial_no', label: 'Serial No', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
      { key: 'manufacturing_batch', label: 'Batch' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', render: (val) => new Date(val).toLocaleDateString() },
    ],
    formFields: [
      { key: 'mcu_id', label: 'MCU ID' },
      { key: 'esp32_mac_address', label: 'ESP32 MAC Address' },
      { key: 'ethernet_mac_address', label: 'Ethernet MAC Address' },
      { key: 'bt_mac_address', label: 'BT MAC Address' },
      { key: 'power_mcu_id', label: 'Power MCU ID' },
      { key: 'pcb_number', label: 'PCB Number' },
      { key: 'production_serial_no', label: 'Production Serial No' },
      { key: 'manufacturing_date_time', label: 'Manufacturing Date', type: 'datetime-local' },
      { key: 'manufacturing_batch', label: 'Manufacturing Batch' },
    ],
  },
  {
    key: 'gsm_tech', label: 'GSM Tech', icon: Radio,
    columns: [
      { key: 'gsm_tech_id', label: 'ID' },
      { key: 'tech_name', label: 'Technology' },
      { key: 'tech_description', label: 'Description' },
      { key: 'frequency_band', label: 'Band' },
      { key: 'entry_by_username', label: 'Created By' },
    ],
    formFields: [
      { key: 'tech_name', label: 'Technology Name', required: true },
      { key: 'tech_description', label: 'Description' },
      { key: 'frequency_band', label: 'Frequency Band' },
    ],
  },
  {
    key: 'gsm', label: 'GSM Module', icon: Activity,
    columns: [
      { key: 'gsm_id', label: 'ID' },
      { key: 'mcu_id', label: 'MCU ID' },
      { key: 'gsm_tech_id', label: 'Tech ID' },
      { key: 'production_serial_no', label: 'Serial No' },
      { key: 'manufacturing_batch', label: 'Batch' },
      { key: 'entry_by_username', label: 'Created By' },
    ],
    formFields: [
      { key: 'mcu_id', label: 'MCU ID' },
      { key: 'gsm_tech_id', label: 'GSM Tech ID' },
      { key: 'pcb_number', label: 'PCB Number' },
      { key: 'production_serial_no', label: 'Serial No' },
      { key: 'manufacturing_date_time', label: 'Manufacturing Date', type: 'datetime-local' },
      { key: 'manufacturing_batch', label: 'Batch' },
    ],
  },
  {
    key: 'gsm_firmware', label: 'GSM FW', icon: FileCode,
    columns: [
      { key: 'gsm_firmware_id', label: 'ID' },
      { key: 'gsm_id', label: 'GSM ID' },
      { key: 'version_no', label: 'Version' },
      { key: 'file_name', label: 'File' },
      { key: 'entry_by_username', label: 'Created By' },
    ],
    formFields: [
      { key: 'gsm_id', label: 'GSM ID' },
      { key: 'version_no', label: 'Version No' },
      { key: 'firmware_description', label: 'Description' },
      { key: 'file_name', label: 'File Name' },
      { key: 'checksum', label: 'Checksum' },
    ],
  },
  {
    key: 'motherboard_firmware', label: 'MB FW', icon: FileCode,
    columns: [
      { key: 'mb_firmware_id', label: 'ID' },
      { key: 'version_no', label: 'Version' },
      { key: 'firmware_description', label: 'Description' },
    ],
    formFields: [
      { key: 'motherboard_id', label: 'Motherboard ID' },
      { key: 'version_no', label: 'Version No' },
      { key: 'firmware_description', label: 'Description' },
    ],
  },
  {
    key: 'pump', label: 'Pump', icon: Layers,
    columns: [
      { key: 'pump_id', label: 'ID' },
      { key: 'pump_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
    formFields: [
      { key: 'pump_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'solenoid_valve', label: 'Valve', icon: Filter,
    columns: [
      { key: 'solenoid_valve_id', label: 'ID' },
      { key: 'solenoid_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
    formFields: [
      { key: 'solenoid_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'flowmeter', label: 'Flowmeter', icon: HardDrive,
    columns: [
      { key: 'flowmeter_id', label: 'ID' },
      { key: 'flowmeter_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
    formFields: [
      { key: 'flowmeter_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'nozzle', label: 'Nozzle', icon: Settings,
    columns: [
      { key: 'nozzle_id', label: 'ID' },
      { key: 'nozzle_serial_no', label: 'Serial No' },
      { key: 'nozzle_type', label: 'Type' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
    formFields: [
      { key: 'nozzle_serial_no', label: 'Serial No' },
      { key: 'nozzle_type', label: 'Nozzle Type' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'filter', label: 'Filter', icon: Filter,
    columns: [
      { key: 'filter_id', label: 'ID' },
      { key: 'filter_serial_no', label: 'Serial No' },
      { key: 'filter_type', label: 'Type' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
    formFields: [
      { key: 'filter_serial_no', label: 'Serial No' },
      { key: 'filter_type', label: 'Filter Type' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'smps', label: 'SMPS', icon: Power,
    columns: [
      { key: 'smps_id', label: 'ID' },
      { key: 'smps_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
    formFields: [
      { key: 'smps_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'relay_box', label: 'Relay Box', icon: Box,
    columns: [
      { key: 'relay_box_id', label: 'ID' },
      { key: 'relay_box_serial_no', label: 'Serial No' },
    ],
    formFields: [
      { key: 'relay_box_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'transformer', label: 'Transformer', icon: Zap,
    columns: [
      { key: 'transformer_id', label: 'ID' },
      { key: 'transformer_serial_no', label: 'Serial No' },
      { key: 'rating', label: 'Rating' },
    ],
    formFields: [
      { key: 'transformer_serial_no', label: 'Serial No' },
      { key: 'input_voltage', label: 'Input Voltage' },
      { key: 'output_voltage', label: 'Output Voltage' },
      { key: 'rating', label: 'Rating' },
    ],
  },
  {
    key: 'emi_emc_filter', label: 'EMI Filter', icon: Shield,
    columns: [
      { key: 'emi_emc_filter_id', label: 'ID' },
      { key: 'filter_serial_no', label: 'Serial No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
    formFields: [
      { key: 'filter_serial_no', label: 'Serial No' },
      { key: 'rating', label: 'Rating' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'printer', label: 'Printer', icon: Printer,
    columns: [
      { key: 'printer_id', label: 'ID' },
      { key: 'printer_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
    ],
    formFields: [
      { key: 'printer_serial_no', label: 'Serial No' },
      { key: 'printer_type', label: 'Printer Type' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'battery', label: 'Battery', icon: Battery,
    columns: [
      { key: 'battery_id', label: 'ID' },
      { key: 'battery_serial_no', label: 'Serial No' },
      { key: 'capacity', label: 'Capacity' },
    ],
    formFields: [
      { key: 'battery_serial_no', label: 'Serial No' },
      { key: 'battery_type', label: 'Battery Type' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'speaker', label: 'Speaker', icon: Volume2,
    columns: [
      { key: 'speaker_id', label: 'ID' },
      { key: 'speaker_serial_no', label: 'Serial No' },
    ],
    formFields: [
      { key: 'speaker_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'tank_sensor', label: 'Tank Sensor', icon: Gauge,
    columns: [
      { key: 'tank_sensor_id', label: 'ID' },
      { key: 'tank_sensor_serial_no', label: 'Serial No' },
    ],
    formFields: [
      { key: 'tank_sensor_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'rccb', label: 'RCCB', icon: Shield,
    columns: [
      { key: 'rccb_id', label: 'ID' },
      { key: 'rccb_serial_no', label: 'Serial No' },
    ],
    formFields: [
      { key: 'rccb_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'spd', label: 'SPD', icon: Zap,
    columns: [
      { key: 'spd_id', label: 'ID' },
      { key: 'spd_serial_no', label: 'Serial No' },
    ],
    formFields: [
      { key: 'spd_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'back_panel_pcb', label: 'Back Panel PCB', icon: Layers,
    columns: [
      { key: 'back_panel_pcb_id', label: 'ID' },
      { key: 'pcb_serial_no', label: 'Serial No' },
      { key: 'pcb_version', label: 'Version' },
    ],
    formFields: [
      { key: 'pcb_serial_no', label: 'Serial No' },
      { key: 'pcb_version', label: 'PCB Version' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'dc_meter', label: 'DC Meter', icon: Gauge,
    columns: [
      { key: 'dc_meter_id', label: 'ID' },
      { key: 'dc_motor_serial_no', label: 'Serial No' },
    ],
    formFields: [
      { key: 'dc_motor_serial_no', label: 'Serial No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'pressure_sensor', label: 'Pressure Sensor', icon: Activity,
    columns: [
      { key: 'pressure_sensor_id', label: 'ID' },
      { key: 'pressure_sensor_serial_no', label: 'Serial No' },
    ],
    formFields: [
      { key: 'pressure_sensor_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
];

export default function ComponentsPage() {
  const { apiFetch } = useAuth();
  const { setAction } = useHeaderAction();
  const [activeTab, setActiveTab] = useState(COMPONENT_TYPES[0].key);
  const [data, setData] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeConfig = COMPONENT_TYPES.find(t => t.key === activeTab);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/components/${activeTab}`);
      if (res.ok) setData(await res.json());
      else setData([]);
    } catch (e) { console.error(e); setData([]); }
    finally { setLoading(false); }
  }, [activeTab, apiFetch]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = useCallback(() => {
    const empty = {};
    activeConfig.formFields.forEach(f => { empty[f.key] = ''; });
    setForm(empty);
    setEditing(null);
    setError('');
    setModal(true);
  }, [activeConfig]);

  useEffect(() => {
    setAction(
      <button className="btn btn-primary" onClick={openCreate}>
        <Plus size={16} /> Add {activeConfig.label}
      </button>
    );
    return () => setAction(null);
  }, [setAction, openCreate, activeConfig.label]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editing
        ? `/api/components/${activeTab}/${editing}`
        : `/api/components/${activeTab}`;
      const res = await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      if (res.ok) {
        setModal(false);
        loadData();
      } else {
        const errData = await res.json();
        setError(errData.message || 'Operation failed');
      }
    } catch (e) { setError(e.message); }
  };

  const onChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Hardware Components</h1>
          <p className="page-subtitle">Inventory management and technical specs for all dispenser parts</p>
        </div>
      </div>

      <div className="components-tabs-container">
        {COMPONENT_TYPES.map(t => (
          <button
            key={t.key}
            className={`component-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <span>Synchronizing {activeConfig.label} data...</span>
        </div>
      ) : (
        <DataTable
          columns={activeConfig.columns}
          data={data}
          onEdit={(row) => {
            setForm(row);
            const pkCol = activeConfig.columns[0].key;
            setEditing(row[pkCol]);
            setModal(true);
          }}
          onDelete={async (row) => {
            const pkCol = activeConfig.columns[0].key;
            if (!confirm('Archive this component record?')) return;
            await apiFetch(`/api/components/${activeTab}/${row[pkCol]}`, { method: 'DELETE' });
            loadData();
          }}
        />
      )}

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? `Edit ${activeConfig.label}` : `Register New ${activeConfig.label}`}
        error={error}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Register'}</button>
        </>}
      >
        <div className="form-grid">
          {activeConfig.formFields.map(field => (
            <div key={field.key} className={`form-group ${field.type === 'textarea' ? 'full-width' : ''}`}>
              <label className="form-label">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  className="form-textarea"
                  value={form[field.key] || ''}
                  onChange={e => onChange(field.key, e.target.value)}
                />
              ) : (
                <input
                  className="form-input"
                  type={field.type || 'text'}
                  value={form[field.key] || ''}
                  onChange={e => onChange(field.key, e.target.value)}
                  required={field.required}
                />
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

