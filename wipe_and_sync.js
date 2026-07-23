const { query } = require('./lib/db');
const axios = require('axios');
const https = require('https');

async function run() {
  try {
    console.log("Wiping tasks table...");
    await query('DELETE FROM tasks');
    
    console.log("Fetching new data from Redmine (status_id=51)...");
    const agent = new https.Agent({ rejectUnauthorized: false });
    const res = await axios.get("https://task.ptdika.com/issues.json?limit=100&status_id=51", {
      headers: { "X-Redmine-API-Key": "b5408133ea672f817d64ef16f5c6667d6f6b36c3" },
      httpsAgent: agent
    });
    
    const issues = res.data.issues || [];
    let synced = 0;
    
    for (const issue of issues) {
      await query(`
        INSERT INTO tasks (redmine_id, title, description, status, assigned_to, due_date)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        issue.id,
        issue.subject,
        issue.description || '',
        'todo', // Kita set semua default masuk Todo
        issue.assigned_to?.name || 'Unassigned',
        issue.due_date || null
      ]);
      synced++;
    }
    console.log(`Success! Inserted ${synced} tasks.`);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
run();
