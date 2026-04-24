const pool = require('./config/db');

async function migrate() {
  console.log('🚀 Starting database migration...');
  
  const client = await pool.connect();
  try {
    // 1. Check if firmware_version_id exists in device_registration
    const checkColumnRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'device_registration' AND column_name = 'firmware_id'
    `);

    if (checkColumnRes.rows.length > 0) {
      console.log('🔄 Renaming firmware_id to firmware_version_id in device_registration...');
      await client.query('ALTER TABLE device_registration RENAME COLUMN firmware_id TO firmware_version_id');
      console.log('✅ Column renamed successfully.');
    } else {
      const checkNewColumnRes = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'device_registration' AND column_name = 'firmware_version_id'
      `);
      
      if (checkNewColumnRes.rows.length === 0) {
        console.log('➕ Adding missing firmware_version_id column to device_registration...');
        await client.query('ALTER TABLE device_registration ADD COLUMN firmware_version_id VARCHAR(36)');
        console.log('✅ Column added successfully.');
      } else {
        console.log('ℹ️ Column firmware_version_id already exists.');
      }
    }

    console.log('🎊 Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
