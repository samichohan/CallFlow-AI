const fs = require('fs');
const content = fs.readFileSync('node_modules/@vapi-ai/web/dist/api.d.ts', 'utf8');

const start = content.indexOf('export interface ClientMessageToolCalls {');
if (start !== -1) {
  console.log(content.substring(start, start + 1200));
} else {
  console.log('Not found');
}

