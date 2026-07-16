import { initMySQL, checkMySQLConnection } from './src/lib/mysql';

async function test() {
  console.log('Testing MySQL connection...');
  try {
    const pool = await initMySQL();
    if (pool && checkMySQLConnection()) {
      console.log('✅ Connection SUCCESSFUL!');
      const [rows] = await pool.execute('SELECT 1 + 1 AS result');
      console.log('Query result:', rows);
      process.exit(0);
    } else {
      console.log('❌ Connection FAILED.');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error during connection test:', err);
    process.exit(1);
  }
}

test();
