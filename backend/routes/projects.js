const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Apply Role-based access control (RBAC) 
// - Admin/Sales for project management
// - Technician can view projects assigned to them (and others for context)
router.use(authenticateToken);
// router.use(authorizeRoles('Admin', 'Sales', 'Technician')); // Removed global restriction
const { v4: uuidv4 } = require('uuid');

// GET /api/projects
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.customer_name, c.company_name
       FROM project_master p
       LEFT JOIN customer_master c ON p.customer_id = c.customer_id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id — With team members
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const project = await pool.query(
      `SELECT p.*, c.customer_name, c.company_name
       FROM project_master p
       LEFT JOIN customer_master c ON p.customer_id = c.customer_id
       WHERE p.project_id = $1`,
      [req.params.id]
    );
    if (project.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

    const team = await pool.query(
      `SELECT pt.*, u.first_name, u.last_name, u.username, u.email
       FROM project_team_master pt
       JOIN user_master u ON pt.user_id = u.user_id
       WHERE pt.project_id = $1`,
      [req.params.id]
    );

    res.json({ ...project.rows[0], team: team.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects
router.post('/', authorizeRoles('Admin', 'Sales'), async (req, res, next) => {
  try {
    const { project_name, customer_id, project_type, status, start_date, end_date, description } = req.body;
    const project_id = uuidv4();

    // Ultra-robust sanitization for Postgres
    const clean = (val) => {
      if (val === "" || val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
        return null;
      }
      return val;
    };

    // Ensure status matches the database CHECK constraint
    const sanitizedStatus = (status || "planning").toLowerCase().replace(" ", "_");
    
    // Resolve valid User ID from database to prevent FK issues with stale tokens
    let dbUserId = req.user.user_id;
    const userRes = await pool.query('SELECT user_id FROM user_master WHERE LOWER(username) = LOWER($1)', [req.user.username]);
    if (userRes.rows.length > 0) {
      dbUserId = userRes.rows[0].user_id;
    } else {
      console.error("USER NOT FOUND IN DB:", req.user.username);
      return res.status(401).json({ error: "Your account could not be verified. Please log in again." });
    }

    const args = [
      project_id,
      project_name,
      clean(customer_id),
      project_type || "New Installation",
      sanitizedStatus,
      clean(start_date),
      clean(end_date),
      clean(description),
      dbUserId
    ];

    console.log("Saving Project with Args:", args);

    // Verify customer exists if provided (skip check if empty)
    const activeCustId = clean(customer_id);
    if (activeCustId) {
      const custCheck = await pool.query('SELECT customer_id FROM customer_master WHERE customer_id = $1', [activeCustId]);
      if (custCheck.rows.length === 0) {
        console.error("CRITICAL: CUSTOMER ID NOT FOUND:", activeCustId);
        return res.status(400).json({ 
          error: `The selected customer (ID: ${activeCustId}) no longer exists in the system. Please refresh the page and select a valid customer.` 
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO project_master (project_id, project_name, customer_id, project_type, status, start_date, end_date, description, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      args
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("CRITICAL PROJECT ERROR:", err.message);
    res.status(400).json({ 
      error: `Database Error: ${err.message}. Data sent: [${args.join(', ')}]` 
    });
  }
});

// PUT /api/projects/:id
router.put("/:id", authorizeRoles("Admin", "Sales"), async (req, res, next) => {
  try {
    const { project_name, customer_id, project_type, status, start_date, end_date, description } = req.body;
    
    const clean = (val) => {
      if (val === "" || val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
        return null;
      }
      return val;
    };

    const args = [
      project_name,
      clean(customer_id),
      project_type,
      status,
      clean(start_date),
      clean(end_date),
      clean(description),
      req.params.id
    ];

    const result = await pool.query(
      `UPDATE project_master SET project_name=$1, customer_id=$2, project_type=$3, status=$4, start_date=$5, end_date=$6, description=$7
       WHERE project_id=$8 RETURNING *`,
      args
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authorizeRoles('Admin', 'Sales'), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM project_team_master WHERE project_id = $1', [req.params.id]);
    await pool.query('DELETE FROM project_master WHERE project_id = $1', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/team — Add team member
router.post('/:id/team', authorizeRoles('Admin', 'Sales'), async (req, res, next) => {
  try {
    const { user_id, role_in_project, allocation_percent, start_date, end_date } = req.body;
    const team_id = uuidv4();
    const result = await pool.query(
      `INSERT INTO project_team_master (team_id, project_id, user_id, role_in_project, allocation_percent, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [team_id, req.params.id, user_id, role_in_project, allocation_percent || 100, start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
