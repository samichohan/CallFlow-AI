const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    env[key] = val;
  }
});

const privateKey = env.VAPI_PRIVATE_API_KEY;
const assistantId = env.VAPI_ASSISTANT_ID;

fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
  headers: {
    'Authorization': `Bearer ${privateKey}`,
    'Content-Type': 'application/json'
  }
})
  .then(async res => {
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('Fetch error:', err);
  });
