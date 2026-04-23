import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';

// ============================================================
// All 20+ component type configurations
// ============================================================
const COMPONENT_TYPES = [
  {
    key: 'motherboard', label: 'Motherboard',
    columns: [
      { key: 'motherboard_id', label: 'ID' },
      { key: 'mcu_id', label: 'MCU ID' },
      { key: 'esp32_mac_address', label: 'ESP32 MAC' },
      { key: 'ethernet_mac_address', label: 'Ethernet MAC' },
      { key: 'pcb_number', label: 'PCB Number' },
      { key: 'production_serial_no', label: 'Serial No' },
      { key: 'manufacturing_batch', label: 'Batch' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
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
    key: 'gsm_tech', label: 'GSM Technology',
    columns: [
      { key: 'gsm_tech_id', label: 'ID' },
      { key: 'tech_name', label: 'Technology' },
      { key: 'tech_description', label: 'Description' },
      { key: 'frequency_band', label: 'Frequency Band' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'tech_name', label: 'Technology Name', required: true },
      { key: 'tech_description', label: 'Description' },
      { key: 'frequency_band', label: 'Frequency Band' },
    ],
  },
  {
    key: 'gsm', label: 'GSM Module',
    columns: [
      { key: 'gsm_id', label: 'ID' },
      { key: 'mcu_id', label: 'MCU ID' },
      { key: 'gsm_tech_id', label: 'Tech ID' },
      { key: 'pcb_number', label: 'PCB Number' },
      { key: 'production_serial_no', label: 'Serial No' },
      { key: 'manufacturing_batch', label: 'Batch' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
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
    key: 'gsm_firmware', label: 'GSM Firmware',
    columns: [
      { key: 'gsm_firmware_id', label: 'ID' },
      { key: 'gsm_id', label: 'GSM ID' },
      { key: 'version_no', label: 'Version' },
      { key: 'firmware_description', label: 'Description' },
      { key: 'file_name', label: 'File' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
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
    key: 'motherboard_firmware', label: 'MB Firmware',
    columns: [
      { key: 'mb_firmware_id', label: 'ID' },
      { key: 'motherboard_id', label: 'MB ID' },
      { key: 'version_no', label: 'Version' },
      { key: 'firmware_description', label: 'Description' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'motherboard_id', label: 'Motherboard ID' },
      { key: 'version_no', label: 'Version No' },
      { key: 'firmware_description', label: 'Description' },
    ],
  },
  {
    key: 'motherboard_firmware_feature', label: 'MB FW Features',
    columns: [
      { key: 'mb_feature_id', label: 'ID' },
      { key: 'version_no', label: 'Version' },
      { key: 'feature_name', label: 'Feature' },
      { key: 'feature_description', label: 'Description' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'version_no', label: 'Version No' },
      { key: 'feature_name', label: 'Feature Name' },
      { key: 'feature_description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    key: 'pump', label: 'Pump',
    columns: [
      { key: 'pump_id', label: 'ID' },
      { key: 'pump_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'pump_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'solenoid_valve', label: 'Solenoid Valve',
    columns: [
      { key: 'solenoid_valve_id', label: 'ID' },
      { key: 'solenoid_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'solenoid_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'flowmeter', label: 'Flowmeter',
    columns: [
      { key: 'flowmeter_id', label: 'ID' },
      { key: 'flowmeter_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'flowmeter_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'flowmeter_firmware', label: 'FM Firmware',
    columns: [
      { key: 'flowmeter_firmware_id', label: 'ID' },
      { key: 'flowmeter_id', label: 'FM ID' },
      { key: 'version_no', label: 'Version' },
      { key: 'firmware_description', label: 'Description' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'flowmeter_id', label: 'Flowmeter ID' },
      { key: 'version_no', label: 'Version No' },
      { key: 'firmware_description', label: 'Description' },
      { key: 'file_name', label: 'File Name' },
      { key: 'checksum', label: 'Checksum' },
    ],
  },
  {
    key: 'nozzle', label: 'Nozzle',
    columns: [
      { key: 'nozzle_id', label: 'ID' },
      { key: 'nozzle_serial_no', label: 'Serial No' },
      { key: 'nozzle_type', label: 'Type' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'nozzle_serial_no', label: 'Serial No' },
      { key: 'nozzle_type', label: 'Nozzle Type' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'filter', label: 'Filter',
    columns: [
      { key: 'filter_id', label: 'ID' },
      { key: 'filter_serial_no', label: 'Serial No' },
      { key: 'filter_type', label: 'Type' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'filter_serial_no', label: 'Serial No' },
      { key: 'filter_type', label: 'Filter Type' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'smps', label: 'SMPS',
    columns: [
      { key: 'smps_id', label: 'ID' },
      { key: 'smps_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'smps_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'relay_box', label: 'Relay Box',
    columns: [
      { key: 'relay_box_id', label: 'ID' },
      { key: 'relay_box_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'relay_box_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'transformer', label: 'Transformer',
    columns: [
      { key: 'transformer_id', label: 'ID' },
      { key: 'transformer_serial_no', label: 'Serial No' },
      { key: 'input_voltage', label: 'Input V' },
      { key: 'output_voltage', label: 'Output V' },
      { key: 'rating', label: 'Rating' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'transformer_serial_no', label: 'Serial No' },
      { key: 'input_voltage', label: 'Input Voltage' },
      { key: 'output_voltage', label: 'Output Voltage' },
      { key: 'rating', label: 'Rating' },
    ],
  },
  {
    key: 'emi_emc_filter', label: 'EMI/EMC Filter',
    columns: [
      { key: 'emi_emc_filter_id', label: 'ID' },
      { key: 'filter_serial_no', label: 'Serial No' },
      { key: 'rating', label: 'Rating' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'filter_serial_no', label: 'Serial No' },
      { key: 'rating', label: 'Rating' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'printer', label: 'Printer',
    columns: [
      { key: 'printer_id', label: 'ID' },
      { key: 'printer_serial_no', label: 'Serial No' },
      { key: 'printer_type', label: 'Type' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'printer_serial_no', label: 'Serial No' },
      { key: 'printer_type', label: 'Printer Type' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'printer_firmware', label: 'Printer FW',
    columns: [
      { key: 'printer_firmware_id', label: 'ID' },
      { key: 'printer_id', label: 'Printer ID' },
      { key: 'version_no', label: 'Version' },
      { key: 'firmware_description', label: 'Description' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'printer_id', label: 'Printer ID' },
      { key: 'version_no', label: 'Version No' },
      { key: 'firmware_description', label: 'Description' },
      { key: 'file_name', label: 'File Name' },
      { key: 'checksum', label: 'Checksum' },
    ],
  },
  {
    key: 'battery', label: 'Battery',
    columns: [
      { key: 'battery_id', label: 'ID' },
      { key: 'battery_serial_no', label: 'Serial No' },
      { key: 'battery_type', label: 'Type' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'battery_serial_no', label: 'Serial No' },
      { key: 'battery_type', label: 'Battery Type' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'speaker', label: 'Speaker',
    columns: [
      { key: 'speaker_id', label: 'ID' },
      { key: 'speaker_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'speaker_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'amplifier', label: 'Amplifier',
    columns: [
      { key: 'amplifier_id', label: 'ID' },
      { key: 'amplifier_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'amplifier_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'tank_sensor', label: 'Tank Sensor',
    columns: [
      { key: 'tank_sensor_id', label: 'ID' },
      { key: 'tank_sensor_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'tank_sensor_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'tank_sensor_firmware', label: 'Tank Sensor FW',
    columns: [
      { key: 'tank_sensor_firmware_id', label: 'ID' },
      { key: 'tank_sensor_id', label: 'Sensor ID' },
      { key: 'version_no', label: 'Version' },
      { key: 'firmware_description', label: 'Description' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'tank_sensor_id', label: 'Tank Sensor ID' },
      { key: 'version_no', label: 'Version No' },
      { key: 'firmware_description', label: 'Description' },
      { key: 'file_name', label: 'File Name' },
      { key: 'checksum', label: 'Checksum' },
    ],
  },
  {
    key: 'quality_sensor', label: 'Quality Sensor',
    columns: [
      { key: 'quality_sensor_id', label: 'ID' },
      { key: 'quality_sensor_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'quality_sensor_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'rccb', label: 'RCCB',
    columns: [
      { key: 'rccb_id', label: 'ID' },
      { key: 'rccb_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'rccb_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'spd', label: 'SPD',
    columns: [
      { key: 'spd_id', label: 'ID' },
      { key: 'spd_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'spd_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'back_panel_pcb', label: 'Back Panel PCB',
    columns: [
      { key: 'back_panel_pcb_id', label: 'ID' },
      { key: 'pcb_serial_no', label: 'Serial No' },
      { key: 'pcb_version', label: 'Version' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'pcb_serial_no', label: 'Serial No' },
      { key: 'pcb_version', label: 'PCB Version' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'dc_meter', label: 'DC Meter',
    columns: [
      { key: 'dc_meter_id', label: 'ID' },
      { key: 'dc_motor_serial_no', label: 'Serial No' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
    ],
    formFields: [
      { key: 'dc_motor_serial_no', label: 'Serial No' },
      { key: 'manufacturer', label: 'Manufacturer' },
    ],
  },
  {
    key: 'pressure_sensor', label: 'Pressure Sensor',
    columns: [
      { key: 'pressure_sensor_id', label: 'ID' },
      { key: 'pressure_sensor_serial_no', label: 'Serial No' },
      { key: 'model_no', label: 'Model' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'entry_by_username', label: 'Created By' },
      { key: 'entry_date_time', label: 'Created', type: 'datetime' },
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
  const [activeTab, setActiveTab] = useState(COMPONENT_TYPES[0].key);
  const [data, setData] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeConfig = COMPONENT_TYPES.find(t => t.key === activeTab);

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/components/${activeTab}`);
      if (res.ok) setData(await res.json());
      else setData([]);
    } catch (e) { console.error(e); setData([]); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    const empty = {};
    activeConfig.formFields.forEach(f => { empty[f.key] = ''; });
    setForm(empty);
    setEditing(null);
    setModal(true);
  };

  const openEdit = (row) => {
    setForm(row);
    const pkCol = activeConfig.columns[0].key;
    setEditing(row[pkCol]);
    setModal(true);
  };

  const handleDelete = async (row) => {
    const pkCol = activeConfig.columns[0].key;
    if (!confirm('Delete this record?')) return;
    await apiFetch(`/api/components/${activeTab}/${row[pkCol]}`, { method: 'DELETE' });
    loadData();
  };

  const handleSubmit = async () => {
    const pkCol = activeConfig.columns[0].key;
    const url = editing
      ? `/api/components/${activeTab}/${editing}`
      : `/api/components/${activeTab}`;
    await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
    setModal(false);
    loadData();
  };

  const onChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Components</h1>
          <p className="page-subtitle">Manage all hardware component inventories</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add {activeConfig.label}
        </button>
      </div>

      <div className="tabs">
        {COMPONENT_TYPES.map(t => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading {activeConfig.label} data...
        </div>
      ) : (
        <DataTable
          columns={activeConfig.columns}
          data={data}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? `Edit ${activeConfig.label}` : `New ${activeConfig.label}`}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button>
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
