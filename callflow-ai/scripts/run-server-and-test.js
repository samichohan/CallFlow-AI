// scripts/run-server-and-test.js
const { spawn } = require('child_process');
const http = require('http');

function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function ping() {
      http.get(url, (res) => {
        resolve();
      }).on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error('Server start timed out after ' + timeout + 'ms'));
        } else {
          setTimeout(ping, 500);
        }
      });
    }
    ping();
  });
}

async function main() {
  console.log('Starting Next.js server for webhook testing...');
  const server = spawn('node', ['node_modules/next/dist/bin/next', 'start'], {
    cwd: __dirname + '/..',
    stdio: 'inherit',
    env: { ...process.env, PORT: '3000' },
  });

  try {
    await waitForServer('http://localhost:3000');
    console.log('Server is responding! Running test-vapi-webhook.js...\n');

    const test = spawn('node', ['scripts/test-vapi-webhook.js'], {
      cwd: __dirname + '/..',
      stdio: 'inherit',
    });

    await new Promise((resolve, reject) => {
      test.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Test script exited with code ' + code));
      });
    });
  } finally {
    console.log('\nStopping test server...');
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

