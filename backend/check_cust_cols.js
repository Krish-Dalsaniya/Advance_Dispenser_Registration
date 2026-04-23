const pool = require('./config/db');

async function checkCustomerColumns() {
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customer_master'
    `);
    console.log('Columns found:', res.rows.map(r => r.column_name).join(', '));
    process.exit(0);
  } catch (err) {
    console.error('Error checking columns:', err.message);
    process.exit(1);
  }
}

checkCustomerColumns();
