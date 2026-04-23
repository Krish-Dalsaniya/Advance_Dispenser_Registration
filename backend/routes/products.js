const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.use(authenticateToken);

// GET /api/products — List with model name join
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*, d.model_name, d.dispenser_type, d.fuel_type, u.username as entry_by_username
       FROM product_master p
       LEFT JOIN dispenser_model_master d ON p.dispenser_model_id = d.dispenser_model_id
       LEFT JOIN user_master u ON p.entry_done_by = u.user_id
       ORDER BY p.entry_date_time DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id — Full detail with images, docs, features, specs
router.get('/:id', async (req, res, next) => {
  try {
    const product = await pool.query(
      `SELECT p.*, d.model_name, d.dispenser_type, d.fuel_type,
              mb.production_serial_no as mb_serial,
              gsm.production_serial_no as gsm_serial,
              pmp.pump_serial_no as pump_serial,
              sv.solenoid_serial_no as solenoid_serial,
              fm.flowmeter_serial_no as flowmeter_serial,
              noz.nozzle_serial_no as nozzle_serial,
              flt.filter_serial_no as filter_serial,
              smps.smps_serial_no as smps_serial,
              rly.relay_box_serial_no as relay_serial,
              trf.transformer_serial_no as transformer_serial,
              emi.filter_serial_no as emi_serial,
              prt.printer_serial_no as printer_serial,
              bat.battery_serial_no as battery_serial,
              spk.speaker_serial_no as speaker_serial,
              amp.amplifier_serial_no as amplifier_serial,
              ts.tank_sensor_serial_no as tank_sensor_serial,
              qs.quality_sensor_serial_no as quality_sensor_serial,
              rccb.rccb_serial_no as rccb_serial,
              spd.spd_serial_no as spd_serial,
              bp.pcb_serial_no as back_panel_serial,
              dcm.dc_motor_serial_no as dc_meter_serial,
              ps.pressure_sensor_serial_no as pressure_sensor_serial
       FROM product_master p
       LEFT JOIN dispenser_model_master d ON p.dispenser_model_id = d.dispenser_model_id
       LEFT JOIN motherboard_master mb ON p.motherboard_id = mb.motherboard_id
       LEFT JOIN gsm_master gsm ON p.gsm_id = gsm.gsm_id
       LEFT JOIN pump_master pmp ON p.pump_id = pmp.pump_id
       LEFT JOIN solenoid_valve_master sv ON p.solenoid_valve_id = sv.solenoid_valve_id
       LEFT JOIN flowmeter_master fm ON p.flowmeter_id = fm.flowmeter_id
       LEFT JOIN nozzle_master noz ON p.nozzle_id = noz.nozzle_id
       LEFT JOIN filter_master flt ON p.filter_id = flt.filter_id
       LEFT JOIN smps_master smps ON p.smps_id = smps.smps_id
       LEFT JOIN relay_box_master rly ON p.relay_box_id = rly.relay_box_id
       LEFT JOIN transformer_master trf ON p.transformer_id = trf.transformer_id
       LEFT JOIN emi_emc_filter_master emi ON p.emi_emc_filter_id = emi.emi_emc_filter_id
       LEFT JOIN printer_master prt ON p.printer_id = prt.printer_id
       LEFT JOIN battery_master bat ON p.battery_id = bat.battery_id
       LEFT JOIN speaker_master spk ON p.speaker_id = spk.speaker_id
       LEFT JOIN amplifier_master amp ON p.amplifier_id = amp.amplifier_id
       LEFT JOIN tank_sensor_master ts ON p.tank_sensor_id = ts.tank_sensor_id
       LEFT JOIN quality_sensor_master qs ON p.quality_sensor_id = qs.quality_sensor_id
       LEFT JOIN rccb_master rccb ON p.rccb_id = rccb.rccb_id
       LEFT JOIN spd_master spd ON p.spd_id = spd.spd_id
       LEFT JOIN back_panel_pcb_master bp ON p.back_panel_pcb_id = bp.back_panel_pcb_id
       LEFT JOIN dc_meter_master dcm ON p.dc_meter_id = dcm.dc_meter_id
       LEFT JOIN pressure_sensor_master ps ON p.pressure_sensor_id = ps.pressure_sensor_id
       WHERE p.product_id = $1`,
      [req.params.id]
    );
    if (product.rows.length === 0) return res.status(404).json({ error: 'Product not found' });

    const [images, docs, features, specs] = await Promise.all([
      pool.query('SELECT * FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC', [req.params.id]),
      pool.query('SELECT * FROM product_documents WHERE product_id = $1', [req.params.id]),
      pool.query('SELECT * FROM product_features WHERE product_id = $1 ORDER BY display_order', [req.params.id]),
      pool.query('SELECT * FROM product_specifications WHERE product_id = $1', [req.params.id]),
    ]);

    res.json({
      ...product.rows[0],
      images: images.rows,
      documents: docs.rows,
      features: features.rows,
      specifications: specs.rows,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/products
router.post('/', authorizeRoles('Admin', 'Engineer', 'Sales'), async (req, res, next) => {
  try {
    const id = uuidv4();
    const {
      product_name, product_description, dispenser_model_id, motherboard_id, gsm_id,
      pump_id, solenoid_valve_id, flowmeter_id, nozzle_id, filter_id, smps_id, relay_box_id,
      transformer_id, emi_emc_filter_id, printer_id, battery_id, speaker_id, tank_sensor_id,
      quality_sensor_id, amplifier_id, rccb_id, spd_id, back_panel_pcb_id, dc_meter_id,
      pressure_sensor_id, production_serial_no, manufacturing_date_time, manufacturing_batch
    } = req.body;

    const result = await pool.query(
      `INSERT INTO product_master (product_id, product_name, product_description, dispenser_model_id, motherboard_id, gsm_id,
       pump_id, solenoid_valve_id, flowmeter_id, nozzle_id, filter_id, smps_id, relay_box_id,
       transformer_id, emi_emc_filter_id, printer_id, battery_id, speaker_id, tank_sensor_id,
       quality_sensor_id, amplifier_id, rccb_id, spd_id, back_panel_pcb_id, dc_meter_id,
       pressure_sensor_id, production_serial_no, manufacturing_date_time, manufacturing_batch, entry_done_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
       RETURNING *`,
      [id, product_name, product_description, dispenser_model_id || null, motherboard_id || null, gsm_id || null,
       pump_id || null, solenoid_valve_id || null, flowmeter_id || null, nozzle_id || null, filter_id || null, smps_id || null, relay_box_id || null,
       transformer_id || null, emi_emc_filter_id || null, printer_id || null, battery_id || null, speaker_id || null, tank_sensor_id || null,
       quality_sensor_id || null, amplifier_id || null, rccb_id || null, spd_id || null, back_panel_pcb_id || null, dc_meter_id || null,
       pressure_sensor_id || null, production_serial_no || null, manufacturing_date_time || null, manufacturing_batch, req.user.user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id
router.put('/:id', authorizeRoles('Admin', 'Engineer', 'Sales'), async (req, res, next) => {
  try {
    const {
      product_name, product_description, dispenser_model_id, motherboard_id, gsm_id,
      pump_id, solenoid_valve_id, flowmeter_id, nozzle_id, filter_id, smps_id, relay_box_id,
      transformer_id, emi_emc_filter_id, printer_id, battery_id, speaker_id, tank_sensor_id,
      quality_sensor_id, amplifier_id, rccb_id, spd_id, back_panel_pcb_id, dc_meter_id,
      pressure_sensor_id, production_serial_no, manufacturing_date_time, manufacturing_batch
    } = req.body;

    const result = await pool.query(
      `UPDATE product_master SET product_name=$1, product_description=$2, dispenser_model_id=$3, motherboard_id=$4, gsm_id=$5,
       pump_id=$6, solenoid_valve_id=$7, flowmeter_id=$8, nozzle_id=$9, filter_id=$10, smps_id=$11, relay_box_id=$12,
       transformer_id=$13, emi_emc_filter_id=$14, printer_id=$15, battery_id=$16, speaker_id=$17, tank_sensor_id=$18,
       quality_sensor_id=$19, amplifier_id=$20, rccb_id=$21, spd_id=$22, back_panel_pcb_id=$23, dc_meter_id=$24,
       pressure_sensor_id=$25, production_serial_no=$26, manufacturing_date_time=$27, manufacturing_batch=$28
       WHERE product_id=$29 RETURNING *`,
      [product_name, product_description, dispenser_model_id || null, motherboard_id || null, gsm_id || null,
       pump_id || null, solenoid_valve_id || null, flowmeter_id || null, nozzle_id || null, filter_id || null, smps_id || null, relay_box_id || null,
       transformer_id || null, emi_emc_filter_id || null, printer_id || null, battery_id || null, speaker_id || null, tank_sensor_id || null,
       quality_sensor_id || null, amplifier_id || null, rccb_id || null, spd_id || null, back_panel_pcb_id || null, dc_meter_id || null,
       pressure_sensor_id || null, production_serial_no || null, manufacturing_date_time || null, manufacturing_batch, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id
router.delete('/:id', authorizeRoles('Admin', 'Engineer', 'Sales'), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM product_features WHERE product_id = $1', [req.params.id]);
    await pool.query('DELETE FROM product_specifications WHERE product_id = $1', [req.params.id]);
    await pool.query('DELETE FROM product_images WHERE product_id = $1', [req.params.id]);
    await pool.query('DELETE FROM product_documents WHERE product_id = $1', [req.params.id]);
    await pool.query('DELETE FROM product_master WHERE product_id = $1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
