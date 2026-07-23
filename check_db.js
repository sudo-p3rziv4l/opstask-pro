const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://admindika:4dm1n%40Danamas@localhost:5432/opstask'
});
async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users';
  `);
  console.log("Columns:", res.rows.map(r => r.column_name).join(', '));
  await client.end();
}
run();
