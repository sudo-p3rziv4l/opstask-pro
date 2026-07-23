const { Pool } = require('pg');
require('fs').readFileSync('.env', 'utf-8').split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].replace(/(^"|"$)/g, '');
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query('ALTER TABLE tasks ADD COLUMN deployment_guide TEXT;');
    console.log("Migration success");
  } catch(e) {
    console.error("Migration error", e.message);
  } finally {
    pool.end();
  }
}
run();
