const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Apply Role-based access control (RBAC) to all customer routes
router.use(authenticateToken);
// router.use(authorizeRoles('Admin', 'Sales')); // Removed global restriction

// GET /api/customers
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { search, status } = req.query;
    let query = 'SELECT * FROM customer_master WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (customer_name ILIKE $${params.length} OR customer_code ILIKE $${params.length} OR company_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/:id
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM customer_master WHERE customer_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/customers
router.post('/', authorizeRoles('Admin', 'Sales'), async (req, res, next) => {
  try {
    const {
      customer_code, customer_name, company_name, contact_person, mobile_no,
      email, address_line1, address_line2, city, state, country, pincode, gst_no
    } = req.body;
    const customer_id = uuidv4();

    const result = await pool.query(
      `INSERT INTO customer_master (customer_id, customer_code, customer_name, company_name, contact_person, mobile_no, email, address_line1, address_line2, city, state, country, pincode, gst_no)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [customer_id, customer_code, customer_name, company_name, contact_person, mobile_no, email, address_line1, address_line2, city, state, country || 'India', pincode, gst_no]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/customers/:id
router.put('/:id', authorizeRoles('Admin', 'Sales'), async (req, res, next) => {
  try {
    const {
      customer_code, customer_name, company_name, contact_person, mobile_no,
      email, address_line1, address_line2, city, state, country, pincode, gst_no, status
    } = req.body;

    const result = await pool.query(
      `UPDATE customer_master SET customer_code=$1, customer_name=$2, company_name=$3, contact_person=$4, mobile_no=$5, email=$6,
       address_line1=$7, address_line2=$8, city=$9, state=$10, country=$11, pincode=$12, gst_no=$13, status=$14, updated_at=CURRENT_TIMESTAMP
       WHERE customer_id=$15 RETURNING *`,
      [customer_code, customer_name, company_name, contact_person, mobile_no, email, address_line1, address_line2, city, state, country, pincode, gst_no, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/customers/:id
router.delete('/:id', authorizeRoles('Admin', 'Sales'), async (req, res, next) => {
  try {
    await pool.query("UPDATE customer_master SET status = 'inactive' WHERE customer_id = $1", [req.params.id]);
    res.json({ message: 'Customer deactivated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
