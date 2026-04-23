const pool = require('./config/db');

async function checkColumns() {
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales_order'
    `);
    console.log('Columns found:', res.rows.map(r => r.column_name).join(', '));
    process.exit(0);
  } catch (err) {
    console.error('Error checking columns:', err.message);
    process.exit(1);
  }
}

checkColumns();
