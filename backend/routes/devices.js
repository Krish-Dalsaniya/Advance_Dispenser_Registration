const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Apply Role-based access control (RBAC) - Admin and Technician can register field devices
router.use(authenticateToken);
router.use(authorizeRoles('Admin', 'Technician'));
const { v4: uuidv4 } = require('uuid');

// GET /api/devices
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT dr.*, c.customer_name, c.company_name, dm.model_name, dm.dispenser_type,
              p.project_name
       FROM device_registration dr
       LEFT JOIN customer_master c ON dr.customer_id = c.customer_id
       LEFT JOIN dispenser_model_master dm ON dr.model_id = dm.dispenser_model_id
       LEFT JOIN project_master p ON dr.project_id = p.project_id
       ORDER BY dr.installation_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/devices/:id
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT dr.*, c.customer_name, c.company_name, c.city, c.state,
              dm.model_name, dm.dispenser_type, dm.fuel_type,
              p.project_name, s.po_number, s.order_date
       FROM device_registration dr
       LEFT JOIN customer_master c ON dr.customer_id = c.customer_id
       LEFT JOIN dispenser_model_master dm ON dr.model_id = dm.dispenser_model_id
       LEFT JOIN project_master p ON dr.project_id = p.project_id
       LEFT JOIN sales_order s ON dr.sale_id = s.sales_id
       WHERE dr.device_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Device not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/devices
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      dispenser_id, sale_id, customer_id, model_id, firmware_id, serial_number,
      project_id, device_uid, iot_sim_no, imei_no, mac_address,
      installation_date, warranty_start, warranty_end
    } = req.body;
    const device_id = uuidv4();

    // Convert empty strings to null to prevent DB errors
    const instDate = installation_date || null;
    const warStart = warranty_start || null;
    const warEnd = warranty_end || null;
    const uid = device_uid || null;
    const imei = imei_no || null;
    const mac = mac_address || null;
    const sim = iot_sim_no || null;
    const custId = customer_id || null;
    const saleId = sale_id || null;
    const modelId = model_id || null;
    const firmwareId = firmware_id || null;

    const result = await pool.query(
      `INSERT INTO device_registration (device_id, dispenser_id, sale_id, customer_id, model_id, firmware_id, serial_number,
       project_id, device_uid, iot_sim_no, imei_no, mac_address, installation_date, warranty_start, warranty_end, installed_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
       [device_id, dispenser_id, saleId, custId, modelId, firmwareId, serial_number,
        project_id, uid, sim, imei, mac, instDate, warStart, warEnd, req.user.user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/devices/:id
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const {
      dispenser_id, sale_id, customer_id, model_id, firmware_id, serial_number,
      project_id, device_uid, iot_sim_no, imei_no, mac_address,
      installation_date, warranty_start, warranty_end
    } = req.body;

    // Convert empty strings to null to prevent DB errors
    const instDate = installation_date || null;
    const warStart = warranty_start || null;
    const warEnd = warranty_end || null;
    const uid = device_uid || null;
    const imei = imei_no || null;
    const mac = mac_address || null;
    const sim = iot_sim_no || null;
    const custId = customer_id || null;
    const modelId = model_id || null;
    const firmwareId = firmware_id || null;

    const result = await pool.query(
      `UPDATE device_registration SET dispenser_id=$1, sale_id=$2, customer_id=$3, model_id=$4, firmware_id=$5, serial_number=$6,
       project_id=$7, device_uid=$8, iot_sim_no=$9, imei_no=$10, mac_address=$11,
       installation_date=$12, warranty_start=$13, warranty_end=$14, updated_at=CURRENT_TIMESTAMP
       WHERE device_id=$15 RETURNING *`,
      [dispenser_id, saleId, custId, modelId, firmwareId, serial_number,
       project_id, uid, sim, imei, mac,
       instDate, warStart, warEnd, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Device not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/devices/:id
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM device_registration WHERE device_id = $1', [req.params.id]);
    res.json({ message: 'Device registration deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
