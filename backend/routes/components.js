const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Apply Role-based access control (RBAC) - Admin and Engineer can manage hardware components
router.use(authenticateToken);
// router.use(authorizeRoles('Admin', 'Engineer')); // Removed global restriction
const { v4: uuidv4 } = require('uuid');

// ============================================================
// COMPONENT TYPE CONFIGURATION
// Maps URL param to table name, primary key, serial column, and extra columns
// ============================================================
const COMPONENT_CONFIG = {
  motherboard: {
    table: 'motherboard_master',
    pk: 'motherboard_id',
    prefix: 'MB',
    serialCol: 'production_serial_no',
    columns: ['mcu_id', 'esp32_mac_address', 'ethernet_mac_address', 'bt_mac_address', 'power_mcu_id', 'pcb_number', 'production_serial_no', 'manufacturing_date_time', 'manufacturing_batch'],
    listColumns: ['motherboard_id', 'mcu_id', 'esp32_mac_address', 'ethernet_mac_address', 'pcb_number', 'production_serial_no', 'manufacturing_batch', 'entry_done_by', 'entry_date_time', 'is_deleted'],
  },
  gsm_tech: {
    table: 'gsm_tech_master',
    pk: 'gsm_tech_id',
    prefix: 'GTECH',
    columns: ['tech_name', 'tech_description', 'frequency_band'],
    listColumns: ['gsm_tech_id', 'tech_name', 'tech_description', 'frequency_band', 'entry_done_by', 'entry_date_time', 'is_deleted'],
  },
  gsm: {
    table: 'gsm_master',
    pk: 'gsm_id',
    prefix: 'GSM',
    serialCol: 'production_serial_no',
    columns: ['mcu_id', 'gsm_tech_id', 'pcb_number', 'production_serial_no', 'manufacturing_date_time', 'manufacturing_batch'],
    listColumns: ['gsm_id', 'mcu_id', 'gsm_tech_id', 'pcb_number', 'production_serial_no', 'manufacturing_batch', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  gsm_firmware: {
    table: 'gsm_firmware_master',
    pk: 'gsm_firmware_id',
    prefix: 'GSMF',
    columns: ['gsm_id', 'version_no', 'firmware_description', 'file_name', 'checksum'],
    listColumns: ['gsm_firmware_id', 'gsm_id', 'version_no', 'firmware_description', 'file_name', 'checksum', 'entry_done_by', 'entry_date_time', 'is_deleted'],
  },
  motherboard_firmware: {
    table: 'motherboard_firmware_master',
    pk: 'mb_firmware_id',
    prefix: 'MBF',
    columns: ['motherboard_id', 'version_no', 'firmware_description'],
    listColumns: ['mb_firmware_id', 'motherboard_id', 'version_no', 'firmware_description', 'entry_done_by', 'entry_date_time', 'is_deleted'],
  },
  motherboard_firmware_feature: {
    table: 'motherboard_firmware_feature_master',
    pk: 'mb_feature_id',
    prefix: 'MBFF',
    columns: ['version_no', 'feature_name', 'feature_description'],
    listColumns: ['mb_feature_id', 'version_no', 'feature_name', 'feature_description', 'entry_done_by', 'entry_date_time', 'is_deleted'],
  },
  pump: {
    table: 'pump_master',
    pk: 'pump_id',
    prefix: 'PUMP',
    serialCol: 'pump_serial_no',
    columns: ['pump_serial_no', 'model_no', 'manufacturer'],
    listColumns: ['pump_id', 'pump_serial_no', 'model_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  solenoid_valve: {
    table: 'solenoid_valve_master',
    pk: 'solenoid_valve_id',
    prefix: 'SV',
    serialCol: 'solenoid_serial_no',
    columns: ['solenoid_serial_no', 'model_no', 'manufacturer'],
    listColumns: ['solenoid_valve_id', 'solenoid_serial_no', 'model_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  flowmeter: {
    table: 'flowmeter_master',
    pk: 'flowmeter_id',
    prefix: 'FM',
    serialCol: 'flowmeter_serial_no',
    columns: ['flowmeter_serial_no', 'model_no', 'manufacturer'],
    listColumns: ['flowmeter_id', 'flowmeter_serial_no', 'model_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  flowmeter_firmware: {
    table: 'flowmeter_firmware_master',
    pk: 'flowmeter_firmware_id',
    prefix: 'FMF',
    columns: ['flowmeter_id', 'version_no', 'firmware_description', 'file_name', 'checksum'],
    listColumns: ['flowmeter_firmware_id', 'flowmeter_id', 'version_no', 'firmware_description', 'file_name', 'entry_done_by', 'entry_date_time', 'is_deleted'],
  },
  nozzle: {
    table: 'nozzle_master',
    pk: 'nozzle_id',
    prefix: 'NOZ',
    serialCol: 'nozzle_serial_no',
    columns: ['nozzle_serial_no', 'nozzle_type', 'manufacturer'],
    listColumns: ['nozzle_id', 'nozzle_serial_no', 'nozzle_type', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  filter: {
    table: 'filter_master',
    pk: 'filter_id',
    prefix: 'FLT',
    serialCol: 'filter_serial_no',
    columns: ['filter_serial_no', 'filter_type', 'model_no', 'manufacturer'],
    listColumns: ['filter_id', 'filter_serial_no', 'filter_type', 'model_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  smps: {
    table: 'smps_master',
    pk: 'smps_id',
    prefix: 'SMPS',
    serialCol: 'smps_serial_no',
    columns: ['smps_serial_no', 'model_no', 'manufacturer'],
    listColumns: ['smps_id', 'smps_serial_no', 'model_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  relay_box: {
    table: 'relay_box_master',
    pk: 'relay_box_id',
    prefix: 'RLY',
    serialCol: 'relay_box_serial_no',
    columns: ['relay_box_serial_no', 'model_no', 'manufacturer'],
    listColumns: ['relay_box_id', 'relay_box_serial_no', 'model_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  transformer: {
    table: 'transformer_master',
    pk: 'transformer_id',
    prefix: 'TRF',
    serialCol: 'transformer_serial_no',
    columns: ['transformer_serial_no', 'input_voltage', 'output_voltage', 'rating'],
    listColumns: ['transformer_id', 'transformer_serial_no', 'input_voltage', 'output_voltage', 'rating', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  emi_emc_filter: {
    table: 'emi_emc_filter_master',
    pk: 'emi_emc_filter_id',
    prefix: 'EMI',
    serialCol: 'filter_serial_no',
    columns: ['filter_serial_no', 'rating', 'model_no', 'manufacturer'],
    listColumns: ['emi_emc_filter_id', 'filter_serial_no', 'rating', 'model_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  printer: {
    table: 'printer_master',
    pk: 'printer_id',
    prefix: 'PRT',
    serialCol: 'printer_serial_no',
    columns: ['printer_serial_no', 'printer_type', 'model_no', 'manufacturer'],
    listColumns: ['printer_id', 'printer_serial_no', 'printer_type', 'model_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  printer_firmware: {
    table: 'printer_firmware_master',
    pk: 'printer_firmware_id',
    prefix: 'PRTF',
    columns: ['printer_id', 'version_no', 'firmware_description', 'file_name', 'checksum'],
    listColumns: ['printer_firmware_id', 'printer_id', 'version_no', 'firmware_description', 'file_name', 'entry_done_by', 'entry_date_time', 'is_deleted'],
  },
  battery: {
    table: 'battery_master',
    pk: 'battery_id',
    prefix: 'BAT',
    serialCol: 'battery_serial_no',
    columns: ['battery_serial_no', 'battery_type', 'capacity', 'manufacturer'],
    listColumns: ['battery_id', 'battery_serial_no', 'battery_type', 'capacity', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  speaker: {
    table: 'speaker_master',
    pk: 'speaker_id',
    prefix: 'SPK',
    serialCol: 'speaker_serial_no',
    columns: ['speaker_serial_no', 'model_no', 'manufacturer'],
    listColumns: ['speaker_id', 'speaker_serial_no', 'model_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  amplifier: {
    table: 'amplifier_master',
    pk: 'amplifier_id',
    prefix: 'AMP',
    serialCol: 'amplifier_serial_no',
    columns: ['amplifier_serial_no', 'model_no', 'manufacturer'],
    listColumns: ['amplifier_id', 'amplifier_serial_no', 'model_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  tank_sensor: {
    table: 'tank_sensor_master',
    pk: 'tank_sensor_id',
    prefix: 'TS',
    serialCol: 'tank_sensor_serial_no',
    columns: ['tank_sensor_serial_no', 'model_no', 'manufacturer'],
    listColumns: ['tank_sensor_id', 'tank_sensor_serial_no', 'model_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  tank_sensor_firmware: {
    table: 'tank_sensor_firmware_master',
    pk: 'tank_sensor_firmware_id',
    prefix: 'TSF',
    columns: ['tank_sensor_id', 'version_no', 'firmware_description', 'file_name', 'checksum'],
    listColumns: ['tank_sensor_firmware_id', 'tank_sensor_id', 'version_no', 'firmware_description', 'file_name', 'entry_done_by', 'entry_date_time', 'is_deleted'],
  },
  quality_sensor: {
    table: 'quality_sensor_master',
    pk: 'quality_sensor_id',
    prefix: 'QS',
    serialCol: 'quality_sensor_serial_no',
    columns: ['quality_sensor_serial_no', 'model_no', 'manufacturer'],
    listColumns: ['quality_sensor_id', 'quality_sensor_serial_no', 'model_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  rccb: {
    table: 'rccb_master',
    pk: 'rccb_id',
    prefix: 'RCCB',
    serialCol: 'rccb_serial_no',
    columns: ['rccb_serial_no', 'model_no', 'manufacturer'],
    listColumns: ['rccb_id', 'rccb_serial_no', 'model_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  spd: {
    table: 'spd_master',
    pk: 'spd_id',
    prefix: 'SPD',
    serialCol: 'spd_serial_no',
    columns: ['spd_serial_no', 'model_no', 'manufacturer'],
    listColumns: ['spd_id', 'spd_serial_no', 'model_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  back_panel_pcb: {
    table: 'back_panel_pcb_master',
    pk: 'back_panel_pcb_id',
    prefix: 'BP',
    serialCol: 'pcb_serial_no',
    columns: ['pcb_serial_no', 'pcb_version', 'manufacturer'],
    listColumns: ['back_panel_pcb_id', 'pcb_serial_no', 'pcb_version', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  dc_meter: {
    table: 'dc_meter_master',
    pk: 'dc_meter_id',
    prefix: 'DCM',
    serialCol: 'dc_motor_serial_no',
    columns: ['dc_motor_serial_no', 'manufacturer'],
    listColumns: ['dc_meter_id', 'dc_motor_serial_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
  pressure_sensor: {
    table: 'pressure_sensor_master',
    pk: 'pressure_sensor_id',
    prefix: 'PS',
    serialCol: 'pressure_sensor_serial_no',
    columns: ['pressure_sensor_serial_no', 'model_no', 'manufacturer'],
    listColumns: ['pressure_sensor_id', 'pressure_sensor_serial_no', 'model_no', 'manufacturer', 'entry_done_by', 'entry_date_time', 'is_deleted', 'is_damaged'],
  },
};

// GET /api/components/types — List all available component types
router.get('/types', authenticateToken, async (req, res) => {
  const types = Object.keys(COMPONENT_CONFIG).map((key) => ({
    key,
    table: COMPONENT_CONFIG[key].table,
    columns: COMPONENT_CONFIG[key].columns,
  }));
  res.json(types);
});

// GET /api/components/:type — List all records of a component type
router.get('/:type', authenticateToken, async (req, res, next) => {
  try {
    const config = COMPONENT_CONFIG[req.params.type];
    if (!config) return res.status(400).json({ error: `Unknown component type: ${req.params.type}` });

    const result = await pool.query(`
      SELECT t.*, u.username as entry_by_username 
      FROM ${config.table} t
      LEFT JOIN user_master u ON t.entry_done_by = u.user_id
      WHERE t.is_deleted = false 
      ORDER BY t.entry_date_time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/components/:type/:id — Get single record
router.get('/:type/:id', authenticateToken, async (req, res, next) => {
  try {
    const config = COMPONENT_CONFIG[req.params.type];
    if (!config) return res.status(400).json({ error: `Unknown component type: ${req.params.type}` });

    const result = await pool.query(`SELECT * FROM ${config.table} WHERE ${config.pk} = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/components/:type — Create new record
router.post('/:type', authorizeRoles('Admin', 'Engineer'), async (req, res, next) => {
  try {
    const config = COMPONENT_CONFIG[req.params.type];
    if (!config) return res.status(400).json({ error: `Unknown component type: ${req.params.type}` });

    const id = uuidv4();
    const allCols = [config.pk, ...config.columns, 'entry_done_by', 'entry_ip_address', 'entry_location'];
    const values = [id];

    config.columns.forEach((col) => {
      values.push(req.body[col] || null);
    });

    values.push(req.user.user_id);
    values.push(req.ip);
    values.push(req.body.entry_location || null);

    const placeholders = allCols.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(
      `INSERT INTO ${config.table} (${allCols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/components/:type/:id — Update record
router.put('/:type/:id', authorizeRoles('Admin', 'Engineer'), async (req, res, next) => {
  try {
    const config = COMPONENT_CONFIG[req.params.type];
    if (!config) return res.status(400).json({ error: `Unknown component type: ${req.params.type}` });

    const setClauses = [];
    const values = [];
    let paramIdx = 1;

    config.columns.forEach((col) => {
      if (req.body[col] !== undefined) {
        setClauses.push(`${col} = $${paramIdx}`);
        values.push(req.body[col]);
        paramIdx++;
      }
    });

    if (setClauses.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE ${config.table} SET ${setClauses.join(', ')} WHERE ${config.pk} = $${paramIdx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/components/:type/:id — Soft delete
router.delete('/:type/:id', authorizeRoles('Admin', 'Engineer'), async (req, res, next) => {
  try {
    const config = COMPONENT_CONFIG[req.params.type];
    if (!config) return res.status(400).json({ error: `Unknown component type: ${req.params.type}` });

    const result = await pool.query(
      `UPDATE ${config.table} SET is_deleted = true, deleted_by_user_id = $1, delete_date_time = CURRENT_TIMESTAMP, delete_location = $2 WHERE ${config.pk} = $3 RETURNING ${config.pk}`,
      [req.user.user_id, req.ip, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
