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
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
});

const privateKey = env.VAPI_PRIVATE_API_KEY;
const assistantId = env.VAPI_ASSISTANT_ID;

fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
  headers: {
    Authorization: `Bearer ${privateKey}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('Assistant Name:', data.name);
  console.log('Model:', data.model?.provider, data.model?.model);
  console.log('ServerUrl:', data.serverUrl);
  console.log('Tools count:', (data.model?.tools || []).length);
  if (data.model?.tools) {
    data.model.tools.forEach((t, i) => {
      console.log(`Tool ${i+1}:`, t.function?.name, 'type:', t.type, 'server:', t.server);
    });
  }
})
.catch(err => console.error('Fetch error:', err));

