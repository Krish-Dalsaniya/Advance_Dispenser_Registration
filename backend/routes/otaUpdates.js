const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.use(authenticateToken);

// GET /api/ota-updates
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT o.*, d.serial_number, d.device_uid, f.version_string as target_version
       FROM ota_update_log o
       LEFT JOIN device_registration d ON o.device_id = d.device_id
       LEFT JOIN firmware_version_master f ON o.to_firmware_id = f.firmware_version_id
       ORDER BY o.triggered_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/ota-updates (Trigger Update)
router.post('/', authorizeRoles('Admin', 'Engineer'), async (req, res, next) => {
  try {
    const { device_id, to_firmware_id, from_firmware_id, notes } = req.body;
    const ota_id = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO ota_update_log (
        ota_id, device_id, from_firmware_id, to_firmware_id, triggered_by, notes, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [ota_id, device_id, from_firmware_id || null, to_firmware_id, req.user.user_id, notes, 'scheduled']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
