const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.use(authenticateToken);

// GET /api/dispenser-models
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM dispenser_model_master WHERE is_deleted = false ORDER BY series_name ASC, model_name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/dispenser-models/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM dispenser_model_master WHERE dispenser_model_id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Model not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/dispenser-models
router.post('/', authorizeRoles('Admin', 'Engineer'), async (req, res, next) => {
  try {
    const { series_name, dispenser_type, fuel_type, model_name, model_description } = req.body;
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO dispenser_model_master (
        dispenser_model_id, series_name, dispenser_type, fuel_type, model_name, 
        model_description, entry_done_by, entry_ip_address
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, series_name, dispenser_type, fuel_type, model_name, model_description, req.user.user_id, req.ip]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/dispenser-models/:id
router.put('/:id', authorizeRoles('Admin', 'Engineer'), async (req, res, next) => {
  try {
    const { series_name, dispenser_type, fuel_type, model_name, model_description } = req.body;
    const result = await pool.query(
      `UPDATE dispenser_model_master SET 
       series_name=$1, dispenser_type=$2, fuel_type=$3, model_name=$4, 
       model_description=$5
       WHERE dispenser_model_id=$6 RETURNING *`,
      [series_name, dispenser_type, fuel_type, model_name, model_description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Model not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/dispenser-models/:id
router.delete('/:id', authorizeRoles('Admin', 'Engineer'), async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE dispenser_model_master SET 
       is_deleted = true, 
       deleted_by_user_id = $1, 
       delete_date_time = CURRENT_TIMESTAMP,
       delete_location = $2
       WHERE dispenser_model_id = $3`,
      [req.user.user_id, req.ip, req.params.id]
    );
    res.json({ message: 'Model deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
