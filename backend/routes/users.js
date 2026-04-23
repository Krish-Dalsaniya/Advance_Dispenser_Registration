const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Apply Role-based access control (RBAC) - Only Admin can manage users
// Apply authentication to all user routes
router.use(authenticateToken);

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// GET /api/users — List all users (Accessible to all authenticated users for assignment)
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.first_name, u.last_name, u.email, u.mobile_no, 
              u.department, u.designation, u.is_active, u.last_login, u.created_at,
              r.role_name, r.role_id
       FROM user_master u
       JOIN user_role_master r ON u.role_id = r.role_id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.first_name, u.last_name, u.email, u.mobile_no,
              u.department, u.designation, u.is_active, u.last_login, u.created_at,
              r.role_name, r.role_id
       FROM user_master u
       JOIN user_role_master r ON u.role_id = r.role_id
       WHERE u.user_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/users
router.post('/', authorizeRoles('Admin'), async (req, res, next) => {
  try {
    const { username, password, first_name, last_name, email, mobile_no, role_id, department, designation } = req.body;
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const user_id = uuidv4();

    const result = await pool.query(
      `INSERT INTO user_master (user_id, role_id, username, password_hash, first_name, last_name, email, mobile_no, department, designation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [user_id, role_id, username, password_hash, first_name, last_name, email, mobile_no, department, designation]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id
router.put('/:id', authorizeRoles('Admin'), async (req, res, next) => {
  try {
    const { first_name, last_name, email, mobile_no, role_id, department, designation, is_active } = req.body;
    const result = await pool.query(
      `UPDATE user_master SET first_name=$1, last_name=$2, email=$3, mobile_no=$4, role_id=$5, department=$6, designation=$7, is_active=$8
       WHERE user_id=$9 RETURNING *`,
      [first_name, last_name, email, mobile_no, role_id, department, designation, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id
router.delete('/:id', authorizeRoles('Admin'), async (req, res, next) => {
  try {
    const result = await pool.query(
      'UPDATE user_master SET is_active = false WHERE user_id = $1 RETURNING user_id',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
