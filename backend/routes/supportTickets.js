const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.use(authenticateToken);

// GET /api/support-tickets
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, customer_id, assigned_to } = req.query;
    let query = `
      SELECT t.*, 
             c.customer_name, 
             u1.username as created_by_name, 
             u2.username as assigned_to_name,
             p.project_name,
             d.serial_number
      FROM support_ticket t
      LEFT JOIN customer_master c ON t.customer_id = c.customer_id
      LEFT JOIN user_master u1 ON t.created_by_user_id = u1.user_id
      LEFT JOIN user_master u2 ON t.assigned_to_user_id = u2.user_id
      LEFT JOIN project_master p ON t.project_id = p.project_id
      LEFT JOIN device_registration d ON t.device_id = d.device_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }
    if (customer_id) {
      params.push(customer_id);
      query += ` AND t.customer_id = $${params.length}`;
    }
    if (assigned_to) {
      params.push(assigned_to);
      query += ` AND t.assigned_to_user_id = $${params.length}`;
    }

    query += ' ORDER BY t.opened_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/support-tickets/:id
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const query = `
      SELECT t.*, 
             c.customer_name, 
             u1.username as created_by_name, 
             u2.username as assigned_to_name,
             p.project_name,
             d.serial_number
      FROM support_ticket t
      LEFT JOIN customer_master c ON t.customer_id = c.customer_id
      LEFT JOIN user_master u1 ON t.created_by_user_id = u1.user_id
      LEFT JOIN user_master u2 ON t.assigned_to_user_id = u2.user_id
      LEFT JOIN project_master p ON t.project_id = p.project_id
      LEFT JOIN device_registration d ON t.device_id = d.device_id
      WHERE t.ticket_id = $1
    `;
    const result = await pool.query(query, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/support-tickets
router.post('/', async (req, res, next) => {
  try {
    const {
      customer_id, device_id, project_id, assigned_to_user_id,
      subject, issue_category, priority, issue_description
    } = req.body;
    
    const ticket_id = uuidv4();
    const ticket_no = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
    const created_by_user_id = req.user.user_id;

    const result = await pool.query(
      `INSERT INTO support_ticket (
         ticket_id, ticket_no, customer_id, device_id, project_id, 
         created_by_user_id, assigned_to_user_id, subject, issue_category, 
         priority, status, issue_description
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        ticket_id, ticket_no, customer_id, device_id || null, project_id || null,
        created_by_user_id, assigned_to_user_id || null, subject, issue_category,
        priority || 'medium', 'open', issue_description
      ]
    );

    // Create an initial chat conversation for this ticket
    const conv_id = uuidv4();
    await pool.query(
      `INSERT INTO chat_conversation (conversation_id, ticket_id, created_by_user_id, chat_type, conversation_name) 
       VALUES ($1, $2, $3, 'ticket', $4)`,
      [conv_id, ticket_id, created_by_user_id, subject]
    );

    // add creator as participant
    await pool.query(
      `INSERT INTO chat_participant (participant_id, conversation_id, user_id, participant_type, is_admin)
       VALUES ($1, $2, $3, 'user', true)`,
      [uuidv4(), conv_id, created_by_user_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/support-tickets/:id
router.put('/:id', async (req, res, next) => {
  try {
    const {
      assigned_to_user_id, subject, issue_category, priority, status, issue_description
    } = req.body;

    let timestampUpdate = '';
    if (status === 'resolved' || status === 'closed') {
      timestampUpdate = status === 'resolved' ? ", resolved_at = CURRENT_TIMESTAMP" : ", closed_at = CURRENT_TIMESTAMP";
    }

    const result = await pool.query(
      `UPDATE support_ticket SET 
         assigned_to_user_id=$1, subject=$2, issue_category=$3, 
         priority=$4, status=$5, issue_description=$6, updated_at=CURRENT_TIMESTAMP ${timestampUpdate}
       WHERE ticket_id=$7 RETURNING *`,
      [assigned_to_user_id || null, subject, issue_category, priority, status, issue_description, req.params.id]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
