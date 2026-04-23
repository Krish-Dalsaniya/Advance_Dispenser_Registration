const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/firmware-versions
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT f.*, c.sales_id, p.product_name
       FROM firmware_version_master f
       LEFT JOIN customer_order_iot_config c ON f.iot_config_id = c.config_id
       LEFT JOIN product_master p ON c.product_id = p.product_id
       ORDER BY f.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/firmware-versions/:id/stable
router.patch('/:id/stable', authorizeRoles('Admin', 'Engineer'), async (req, res, next) => {
  try {
    const result = await pool.query(
      'UPDATE firmware_version_master SET is_stable = true, approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE firmware_version_id = $2 RETURNING *',
      [req.user.user_id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Version not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
