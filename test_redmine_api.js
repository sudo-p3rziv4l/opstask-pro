const axios = require('axios');
const https = require('https');

async function test() {
  const agent = new https.Agent({ rejectUnauthorized: false });
  try {
    const res = await axios.get("https://task.ptdika.com/issues.json?limit=100&status_id=51", {
      headers: { "X-Redmine-API-Key": "b5408133ea672f817d64ef16f5c6667d6f6b36c3" },
      httpsAgent: agent
    });
    console.log(`Total issues fetched: ${res.data.issues.length}`);
    res.data.issues.forEach(i => console.log(`- [#${i.id}] ${i.subject}`));
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();
