const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dashboard/stats — Aggregated statistics
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const [
      customers, products, salesOrders, devices, projects,
      users, dispenserModels, pendingOrders, activeProjects,
      recentDevices, monthlySales, componentCounts
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM customer_master WHERE status = 'active'"),
      pool.query('SELECT COUNT(*) as count FROM product_master'),
      pool.query('SELECT COUNT(*) as count FROM sales_order'),
      pool.query('SELECT COUNT(*) as count FROM device_registration'),
      pool.query('SELECT COUNT(*) as count FROM project_master'),
      pool.query('SELECT COUNT(*) as count FROM user_master WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as count FROM dispenser_model_master WHERE is_deleted = false'),
      pool.query("SELECT COUNT(*) as count FROM sales_order WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) as count FROM project_master WHERE status = 'active'"),
      // Recent device registrations
      pool.query(
        `SELECT dr.device_id, dr.serial_number, dr.device_uid, dr.installation_date,
                c.customer_name, dm.model_name
         FROM device_registration dr
         LEFT JOIN customer_master c ON dr.customer_id = c.customer_id
         LEFT JOIN dispenser_model_master dm ON dr.model_id = dm.dispenser_model_id
         ORDER BY dr.installation_date DESC LIMIT 5`
      ),
      // Monthly sales (last 6 months)
      pool.query(
        `SELECT TO_CHAR(order_date, 'Mon YYYY') as month,
                COUNT(*) as order_count,
                COALESCE(SUM(si.total), 0) as revenue
         FROM sales_order so
         LEFT JOIN (
           SELECT sales_id, SUM(quantity * unit_price) as total
           FROM sales_order_items
           GROUP BY sales_id
         ) si ON so.sales_id = si.sales_id
         WHERE so.order_date >= CURRENT_DATE - INTERVAL '12 months'
         GROUP BY TO_CHAR(order_date, 'Mon YYYY'), DATE_TRUNC('month', order_date)
         ORDER BY DATE_TRUNC('month', order_date) ASC`
      ),
      // Component counts
      Promise.all([
        pool.query('SELECT COUNT(*) as count FROM motherboard_master WHERE is_deleted = false'),
        pool.query('SELECT COUNT(*) as count FROM gsm_master WHERE is_deleted = false'),
        pool.query('SELECT COUNT(*) as count FROM pump_master WHERE is_deleted = false'),
        pool.query('SELECT COUNT(*) as count FROM flowmeter_master WHERE is_deleted = false'),
        pool.query('SELECT COUNT(*) as count FROM nozzle_master WHERE is_deleted = false'),
        pool.query('SELECT COUNT(*) as count FROM printer_master WHERE is_deleted = false'),
        pool.query('SELECT COUNT(*) as count FROM battery_master WHERE is_deleted = false'),
        pool.query('SELECT COUNT(*) as count FROM tank_sensor_master WHERE is_deleted = false'),
      ]),
    ]);

    res.json({
      summary: {
        total_customers: parseInt(customers.rows[0].count),
        total_products: parseInt(products.rows[0].count),
        total_sales_orders: parseInt(salesOrders.rows[0].count),
        total_devices: parseInt(devices.rows[0].count),
        total_projects: parseInt(projects.rows[0].count),
        total_users: parseInt(users.rows[0].count),
        total_dispenser_models: parseInt(dispenserModels.rows[0].count),
        pending_orders: parseInt(pendingOrders.rows[0].count),
        active_projects: parseInt(activeProjects.rows[0].count),
      },
      recent_devices: recentDevices.rows,
      monthly_sales: monthlySales.rows,
      component_inventory: {
        motherboards: parseInt(componentCounts[0].rows[0].count),
        gsm_modules: parseInt(componentCounts[1].rows[0].count),
        pumps: parseInt(componentCounts[2].rows[0].count),
        flowmeters: parseInt(componentCounts[3].rows[0].count),
        nozzles: parseInt(componentCounts[4].rows[0].count),
        printers: parseInt(componentCounts[5].rows[0].count),
        batteries: parseInt(componentCounts[6].rows[0].count),
        tank_sensors: parseInt(componentCounts[7].rows[0].count),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
