const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Find user with role info
    const result = await pool.query(
      `SELECT u.*, r.role_name 
       FROM user_master u 
       JOIN user_role_master r ON u.role_id = r.role_id 
       WHERE LOWER(u.username) = LOWER($1) AND u.is_active = true`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = result.rows[0];

    // Try bcrypt comparison if it looks like a hash, otherwise fallback to plaintext (dev only)
    let isValid = false;
    if (user.password_hash && (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$'))) {
      try {
        isValid = await bcrypt.compare(password, user.password_hash);
      } catch (e) {
        isValid = false;
      }
    } else {
      isValid = password === user.password_hash;
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Update last_login
    await pool.query(
      'UPDATE user_master SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    // Generate JWT
    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role_id: user.role_id,
        role_name: user.role_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Get permissions for this role
    const permsResult = await pool.query(
      `SELECT p.permission_name, p.module_name, rpm.can_view, rpm.can_create, rpm.can_edit, rpm.can_delete, rpm.can_approve
       FROM role_permission_map rpm
       JOIN permission_master p ON rpm.permission_id = p.permission_id
       WHERE rpm.role_id = $1`,
      [user.role_id]
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name,
        department: user.department,
        designation: user.designation,
      },
      permissions: permsResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, first_name, last_name, email, mobile_no, role_id, department, designation } = req.body;

    if (!username || !password || !role_id) {
      return res.status(400).json({ error: 'Username, password, and role_id are required.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { v4: uuidv4 } = require('uuid');
    const user_id = uuidv4();

    const result = await pool.query(
      `INSERT INTO user_master (user_id, role_id, username, password_hash, first_name, last_name, email, mobile_no, department, designation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING user_id, username, first_name, last_name, email, role_id`,
      [user_id, role_id, username, password_hash, first_name, last_name, email, mobile_no, department, designation]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
