const fs = require('fs');

const content = fs.readFileSync('node_modules/@vapi-ai/web/dist/api.d.ts', 'utf8');

const regex = /export interface (ToolCallResult[A-Za-z0-9]*|ClientMessage[A-Za-z0-9]*|[A-Za-z0-9]*ToolCall[A-Za-z0-9]*)/g;
let match;
const results = new Set();
while ((match = regex.exec(content)) !== null) {
  results.add(match[1]);
}
console.log('Matches:', Array.from(results));

// Search for tool-calls
const toolCallIndices = [];
let idx = 0;
while ((idx = content.indexOf('tool-calls', idx + 1)) !== -1) {
  toolCallIndices.push(idx);
}
console.log('tool-calls occurrences:', toolCallIndices.length);
for (const i of toolCallIndices.slice(0, 5)) {
  console.log('--- Context at', i, '---');
  console.log(content.substring(Math.max(0, i - 150), Math.min(content.length, i + 350)));
}

