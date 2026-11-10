const fs = require('fs');
const vapiDts = fs.readFileSync('node_modules/@vapi-ai/web/dist/vapi.d.ts', 'utf8');
console.log('=== vapi.d.ts ClientToServerMessage ===');
const m1 = vapiDts.match(/type VapiClientToServerMessage = [^;]+;/);
console.log(m1 ? m1[0] : 'not found');

// Let's check api.d.ts for any ClientToServer or similar
const apiDts = fs.readFileSync('node_modules/@vapi-ai/web/dist/api.d.ts', 'utf8');
const matches = apiDts.match(/type [A-Za-z0-9]*ClientMessage[A-Za-z0-9]* = [^;]+;/g);
console.log('=== api.d.ts ClientMessage types ===', matches ? matches.slice(0, 5) : 'none');

