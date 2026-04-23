const pool = require('./config/db');

async function checkTables() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables found:', res.rows.map(r => r.table_name).join(', '));
    process.exit(0);
  } catch (err) {
    console.error('Error checking tables:', err.message);
    process.exit(1);
  }
}

checkTables();
