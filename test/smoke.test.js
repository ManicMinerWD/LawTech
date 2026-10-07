// test/smoke.test.js
// End-to-end smoke test: boots the LawTech server on an ephemeral port and
// asserts the API serves seeded data. It spins up the REAL server so CI
// validates exactly the code that ships -- nothing is mocked.

const { test } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DB_FILES = ['lawtech.db', 'lawtech.db-wal', 'lawtech.db-shm'];

// Find and release a free TCP port, then resolve with it.
function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = http.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

// GET a JSON endpoint and resolve with { status, body }.
function getJson(port, pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { host: '127.0.0.1', port, path: pathname, timeout: 5000 },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (err) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy(new Error(`request timed out: ${pathname}`));
    });
  });
}

// Poll an endpoint until it resolves successfully or the timeout elapses.
async function waitFor(port, pathname, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      return await getJson(port, pathname);
    } catch (err) {
      // Connection refused / timeouts are expected while the server boots.
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error(`Timed out waiting for ${pathname} on port ${port} after ${timeoutMs}ms`);
}

test(
  'LawTech boots and serves seeded API data',
  { timeout: 30000 },
  async () => {
    // Fresh DB so the smoke test is deterministic across runs.
    for (const file of ['lawtech.db', 'lawtech.db-wal', 'lawtech.db-shm']) {
      try {
        fs.unlinkSync(path.join(ROOT, file));
      } catch (err) {
        // File may not exist yet -- that is fine.
      }
    }

    const port = await findFreePort();
    const env = { ...process.env, PORT: String(port) };
    const child = spawn(process.execPath, ['server.js'], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let serverOutput = '';
    child.stdout.on('data', (chunk) => {
      serverOutput += chunk;
    });
    child.stderr.on('data', (chunk) => {
      serverOutput += chunk;
    });

    try {
      // Wait for the server to boot before hitting the API.
      const health = await waitFor(port, '/api/health');
      assert.strictEqual(health.status, 200, `health status: ${health.status}`);
      assert.strictEqual(health.body.status, 'ok');
      assert.ok(health.body.timestamp, 'health payload should include a timestamp');

      const clients = await waitFor(port, '/api/clients');
      assert.strictEqual(clients.status, 200, `clients status: ${clients.status}`);
      assert.ok(Array.isArray(clients.body), 'clients response should be an array');
      assert.ok(clients.body.length > 0, 'clients should be seeded on first run');
      assert.ok(
        clients.body.some((c) => c.name === 'Sarah Johnson'),
        'expected seeded client "Sarah Johnson"'
      );

      const articles = await waitFor(port, '/api/articles');
      assert.strictEqual(articles.status, 200, `articles status: ${articles.status}`);
      assert.ok(Array.isArray(articles.body), 'articles response should be an array');
      assert.ok(articles.body.length > 0, 'articles should be seeded on first run');
      assert.ok(
        articles.body.some((a) => a.title.includes('M&A')),
        'expected seeded article about M&A due diligence'
      );

      const cases = await waitFor(port, '/api/cases');
      assert.strictEqual(cases.status, 200, `cases status: ${cases.status}`);
      assert.ok(Array.isArray(cases.body), 'cases response should be an array');
    } finally {
      child.kill('SIGTERM');
      // Give the server a moment to release the port before the test ends.
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
);
