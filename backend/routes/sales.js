const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Apply Role-based access control (RBAC) to all sales routes
router.use(authenticateToken);
router.use(authorizeRoles('Admin', 'Sales'));
const { v4: uuidv4 } = require('uuid');

// GET /api/sales — List with customer join
router.get('/', authenticateToken, async (req, res, next) => {
  console.log('GET /api/sales hit by user:', req.user.username);
  try {
    const result = await pool.query(
      `SELECT s.*, c.customer_name, c.company_name
       FROM sales_order s
       LEFT JOIN customer_master c ON s.customer_id = c.customer_id
       ORDER BY s.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/sales/:id — With line items
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const order = await pool.query(
      `SELECT s.*, c.customer_name, c.company_name, c.email, c.mobile_no
       FROM sales_order s
       LEFT JOIN customer_master c ON s.customer_id = c.customer_id
       WHERE s.sales_id = $1`,
      [req.params.id]
    );
    if (order.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const items = await pool.query(
      `SELECT si.*,
              p.product_name, dm.model_name, dm.dispenser_type, dm.fuel_type
       FROM sales_order_items si
       LEFT JOIN product_master p ON si.product_id = p.product_id
       LEFT JOIN dispenser_model_master dm ON p.dispenser_model_id = dm.dispenser_model_id
       WHERE si.sales_id = $1`,
      [req.params.id]
    );

    res.json({ ...order.rows[0], items: items.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/sales
router.post('/', authenticateToken, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { customer_id, site_id, order_date, po_number, remarks, status, items, total_amount, tax_amount, discount_amount } = req.body;
    const sales_id = uuidv4();

    await client.query('BEGIN');

    console.log('--- POST /api/sales Debug ---');
    console.log('User from Token:', req.user);
    console.log('Customer ID:', customer_id);
    console.log('Created By (req.user.user_id):', req.user.user_id);

    await client.query(
      `INSERT INTO sales_order (sales_id, customer_id, site_id, order_date, po_number, remarks, status, total_amount, tax_amount, discount_amount, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        sales_id, customer_id, site_id, order_date, po_number, remarks, status || 'pending', 
        Number(total_amount) || 0, Number(tax_amount) || 0, Number(discount_amount) || 0, req.user.user_id
      ]
    );

    // Insert line items
    if (items && items.length > 0) {
      for (const item of items) {
        const item_id = uuidv4();
        let customer_iot_config_id = null;

        if (item.is_iot_order && item.iot_config) {
          customer_iot_config_id = uuidv4();
          const { nozzle_count, dispensing_speed, connectivity, keyboard_format, config_notes } = item.iot_config;
          
          // Create IoT Config
          await client.query(
            `INSERT INTO customer_order_iot_config (
              config_id, sales_id, product_id, nozzle_count, dispensing_speed,
              conn_ethernet, conn_wifi, conn_bluetooth, conn_modbus_rs485, 
              conn_gsm_2g, conn_gsm_4g, conn_gps, keyboard_format, 
              config_notes, configured_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
            [
              customer_iot_config_id, sales_id, item.product_id, Number(nozzle_count) || 1, Number(dispensing_speed) || 4,
              connectivity.ethernet || false, connectivity.wifi || false, connectivity.bluetooth || false, 
              connectivity.modbus_rs485 || false, connectivity.gsm_2g || false, connectivity.gsm_4g || false, 
              connectivity.gps || false, keyboard_format, config_notes, req.user.user_id
            ]
          );

          // Generate Firmware Version
          const fw_id = uuidv4();
          // Version string logic: MODEL-NZ-SPD-CONN-KBD-v1.0.0
          const connStr = Object.keys(connectivity || {}).filter(k => connectivity[k]).map(k => k.toUpperCase()).join('-') || 'NONE';
          const version_string = `IOT-${nozzle_count}NZ-${dispensing_speed}L-${connStr}-${keyboard_format}-v1.0.0-${fw_id.substring(0,8)}`;
          
          await client.query(
            `INSERT INTO firmware_version_master (
              firmware_version_id, iot_config_id, version_string, nozzle_count, dispensing_speed,
              conn_ethernet, conn_wifi, conn_bluetooth, conn_modbus_rs485, 
              conn_gsm_2g, conn_gsm_4g, conn_gps, keyboard_format, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
            [
              fw_id, customer_iot_config_id, version_string, Number(nozzle_count) || 1, Number(dispensing_speed) || 4,
              connectivity.ethernet || false, connectivity.wifi || false, connectivity.bluetooth || false, 
              connectivity.modbus_rs485 || false, connectivity.gsm_2g || false, connectivity.gsm_4g || false, 
              connectivity.gps || false, keyboard_format, req.user.user_id
            ]
          );

          // Update IoT Config with Firmware Version link
          await client.query(
            `UPDATE customer_order_iot_config SET firmware_version_id = $1 WHERE config_id = $2`,
            [fw_id, customer_iot_config_id]
          );
        }

        await client.query(
          `INSERT INTO sales_order_items (item_id, sales_id, product_id, quantity, unit_price, is_iot_order, customer_iot_config_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            item_id, sales_id, item.product_id, Number(item.quantity) || 0, 
            Number(item.unit_price) || 0, item.is_iot_order || false, customer_iot_config_id
          ]
        );
      }
    }

    await client.query('COMMIT');
    const result = await client.query('SELECT * FROM sales_order WHERE sales_id = $1', [sales_id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// PUT /api/sales/:id
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { customer_id, site_id, order_date, po_number, remarks, status, total_amount, tax_amount, discount_amount } = req.body;
    const result = await pool.query(
      `UPDATE sales_order SET 
       customer_id=$1, site_id=$2, order_date=$3, po_number=$4, remarks=$5, status=$6, 
       total_amount=$7, tax_amount=$8, discount_amount=$9, updated_at=CURRENT_TIMESTAMP
       WHERE sales_id=$10 RETURNING *`,
      [customer_id, site_id, order_date, po_number, remarks, status, total_amount, tax_amount, discount_amount, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sales/:id
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM sales_order_items WHERE sales_id = $1', [req.params.id]);
    await pool.query('DELETE FROM sales_order WHERE sales_id = $1', [req.params.id]);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
