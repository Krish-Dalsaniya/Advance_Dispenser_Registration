const pool = require('./config/db');

async function checkTypes() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_master'
    `);
    console.log('Columns and Types:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error checking types:', err.message);
    process.exit(1);
  }
}

checkTypes();
