const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.use(authenticateToken);

// GET /api/dispenser-configurations
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT dc.*, dm.model_name, mbf.version_no as mb_firmware_version, gsf.version_no as gsm_firmware_version
      FROM dispenser_configuration dc
      LEFT JOIN dispenser_model_master dm ON dc.dispenser_model_id = dm.dispenser_model_id
      LEFT JOIN motherboard_firmware_master mbf ON dc.mb_firmware_id = mbf.mb_firmware_id
      LEFT JOIN gsm_firmware_master gsf ON dc.gsm_firmware_id = gsf.gsm_firmware_id
      ORDER BY dc.configured_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/dispenser-configurations
router.post('/', authorizeRoles('Admin', 'Engineer'), async (req, res, next) => {
  try {
    const {
      dispenser_model_id, config_name, mb_firmware_id, gsm_firmware_id,
      nozzle_count, connectivity_type, keyboard_format, config_notes, approved_by
    } = req.body;
    const configuration_id = uuidv4();

    const result = await pool.query(
      `INSERT INTO dispenser_configuration (
        configuration_id, dispenser_model_id, config_name, mb_firmware_id, gsm_firmware_id,
        nozzle_count, connectivity_type, keyboard_format, config_notes, configured_by, approved_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        configuration_id, dispenser_model_id, config_name, mb_firmware_id, gsm_firmware_id,
        nozzle_count || 1, connectivity_type, keyboard_format, config_notes, req.user.user_id, approved_by || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/dispenser-configurations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM dispenser_configuration WHERE configuration_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Configuration not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
