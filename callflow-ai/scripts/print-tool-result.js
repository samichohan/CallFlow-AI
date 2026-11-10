const fs = require('fs');
const content = fs.readFileSync('node_modules/@vapi-ai/web/dist/api.d.ts', 'utf8');

function printInterface(name) {
  const start = content.indexOf(`export interface ${name}`);
  if (start !== -1) {
    console.log(content.substring(start, start + 800));
  } else {
    console.log(`Interface ${name} not found`);
  }
}

printInterface('ClientMessageToolCallsResult');
printInterface('ToolCallResult');
printInterface('ServerMessageResponseToolCalls');

