const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.use(authenticateToken);

// GET chat context for a ticket
router.get('/ticket/:ticket_id', async (req, res, next) => {
  try {
    const { ticket_id } = req.params;
    
    // Find conversation
    const convResult = await pool.query('SELECT * FROM chat_conversation WHERE ticket_id = $1', [ticket_id]);
    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'No chat conversation found for this ticket.' });
    }
    const conversation = convResult.rows[0];

    // Load messages
    const msgsQuery = `
      SELECT m.*, 
             p.user_id, p.customer_id, p.participant_type,
             u.username as sender_user_name,
             c.customer_name as sender_customer_name
      FROM chat_message m
      LEFT JOIN chat_participant p ON m.sender_participant_id = p.participant_id
      LEFT JOIN user_master u ON p.user_id = u.user_id
      LEFT JOIN customer_master c ON p.customer_id = c.customer_id
      WHERE m.conversation_id = $1
      ORDER BY m.sent_at ASC
    `;
    const messages = await pool.query(msgsQuery, [conversation.conversation_id]);

    res.json({
      conversation,
      messages: messages.rows
    });
  } catch (err) {
    next(err);
  }
});

// POST message to a ticket's conversation
router.post('/ticket/:ticket_id/messages', async (req, res, next) => {
  try {
    const { ticket_id } = req.params;
    const { message_text, is_internal_note } = req.body;
    const user_id = req.user.user_id;

    // 1. Get Conversation ID
    const convResult = await pool.query('SELECT conversation_id FROM chat_conversation WHERE ticket_id = $1', [ticket_id]);
    if (convResult.rows.length === 0) return res.status(404).json({ error: 'Conversation not found.' });
    const conversation_id = convResult.rows[0].conversation_id;

    // 2. Ensure user is a participant
    let partResult = await pool.query('SELECT participant_id FROM chat_participant WHERE conversation_id = $1 AND user_id = $2', [conversation_id, user_id]);
    let participant_id;
    if (partResult.rows.length === 0) {
      participant_id = uuidv4();
      await pool.query(
        `INSERT INTO chat_participant (participant_id, conversation_id, user_id, participant_type) VALUES ($1,$2,$3,'user')`,
        [participant_id, conversation_id, user_id]
      );
    } else {
      participant_id = partResult.rows[0].participant_id;
    }

    // 3. Insert Message
    const message_id = uuidv4();
    const result = await pool.query(
      `INSERT INTO chat_message (message_id, conversation_id, sender_participant_id, message_text, is_internal_note)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [message_id, conversation_id, participant_id, message_text, is_internal_note || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
