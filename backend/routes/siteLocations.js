const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.use(authenticateToken);

// GET /api/site-locations
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { customer_id } = req.query;
    let query = `
      SELECT sl.*, c.customer_name 
      FROM site_location_master sl
      JOIN customer_master c ON sl.customer_id = c.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (customer_id) {
      params.push(customer_id);
      query += ` AND sl.customer_id = $${params.length}`;
    }

    query += ' ORDER BY sl.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/site-locations/:id
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM site_location_master WHERE site_location_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Site location not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/site-locations
router.post('/', authorizeRoles('Admin', 'Sales'), async (req, res, next) => {
  try {
    const {
      customer_id, site_name, address_line1, address_line2, city, state, country, pincode
    } = req.body;
    const site_location_id = uuidv4();

    const result = await pool.query(
      `INSERT INTO site_location_master (site_location_id, customer_id, site_name, address_line1, address_line2, city, state, country, pincode)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [site_location_id, customer_id, site_name, address_line1, address_line2, city, state, country || 'India', pincode]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/site-locations/:id
router.put('/:id', authorizeRoles('Admin', 'Sales'), async (req, res, next) => {
  try {
    const {
      customer_id, site_name, address_line1, address_line2, city, state, country, pincode
    } = req.body;

    const result = await pool.query(
      `UPDATE site_location_master SET customer_id=$1, site_name=$2, address_line1=$3, address_line2=$4, city=$5, state=$6, country=$7, pincode=$8, updated_at=CURRENT_TIMESTAMP
       WHERE site_location_id=$9 RETURNING *`,
      [customer_id, site_name, address_line1, address_line2, city, state, country, pincode, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Site location not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/site-locations/:id
router.delete('/:id', authorizeRoles('Admin', 'Sales'), async (req, res, next) => {
  try {
    await pool.query("DELETE FROM site_location_master WHERE site_location_id = $1", [req.params.id]);
    res.json({ message: 'Site location deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
