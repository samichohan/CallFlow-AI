const fs = require('fs');
const path = require('path');

function walk(dir, skip) {
  const r = [];
  if (!fs.existsSync(dir)) return r;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (skip.some(s => p.includes(s))) continue;
    const s = fs.statSync(p);
    if (s.isDirectory()) r.push(...walk(p, skip));
    else r.push(p);
  }
  return r;
}

const files = walk('.', ['node_modules', '.next', '.git', 'dev.db']);
files.forEach(f => console.log(f));
