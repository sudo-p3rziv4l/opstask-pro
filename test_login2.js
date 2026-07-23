const fetch = require('node-fetch');
async function run() {
  const res = await fetch('http://127.0.0.1:4175/api/auth', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username: 'admindika', password: 'kokounokasi9012'})
  });
  console.log(res.status, await res.text());
}
run();
