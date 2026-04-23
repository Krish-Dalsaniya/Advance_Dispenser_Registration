const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Apply Role-based access control (RBAC) - Only Admin can manage roles and permissions
router.use(authenticateToken);
router.use(authorizeRoles('Admin'));
const { v4: uuidv4 } = require('uuid');

// GET /api/roles
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM user_role_master ORDER BY created_at');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/roles/:id
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const role = await pool.query('SELECT * FROM user_role_master WHERE role_id = $1', [req.params.id]);
    if (role.rows.length === 0) return res.status(404).json({ error: 'Role not found' });

    // Get permissions for this role
    const perms = await pool.query(
      `SELECT rpm.*, p.permission_name, p.module_name, p.description
       FROM role_permission_map rpm
       JOIN permission_master p ON rpm.permission_id = p.permission_id
       WHERE rpm.role_id = $1`,
      [req.params.id]
    );

    res.json({ ...role.rows[0], permissions: perms.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/roles
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { role_name, role_description } = req.body;
    const role_id = uuidv4();
    const result = await pool.query(
      'INSERT INTO user_role_master (role_id, role_name, role_description) VALUES ($1, $2, $3) RETURNING *',
      [role_id, role_name, role_description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/roles/:id
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { role_name, role_description, is_active } = req.body;
    const result = await pool.query(
      'UPDATE user_role_master SET role_name=$1, role_description=$2, is_active=$3 WHERE role_id=$4 RETURNING *',
      [role_name, role_description, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Role not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/roles/:id
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    await pool.query('UPDATE user_role_master SET is_active = false WHERE role_id = $1', [req.params.id]);
    res.json({ message: 'Role deactivated' });
  } catch (err) {
    next(err);
  }
});

// GET /api/roles/permissions/all
router.get('/permissions/all', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM permission_master ORDER BY module_name');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
