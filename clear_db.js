const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://admindika:4dm1n%40Danamas@localhost:5432/opstask'
});
async function run() {
  await client.connect();
  await client.query('DELETE FROM tasks');
  console.log("Tasks deleted.");
  await client.end();
}
run();
