import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = await mkdtemp(join(tmpdir(), 'nextstory-seed-'));
try {
  const mock = join(dir, 'fetch.mjs');
  await writeFile(mock, `
    import assert from 'node:assert/strict';
    let calls = 0;
    globalThis.fetch = async (url, options) => {
      calls++;
      assert(url.startsWith('https://firestore.googleapis.com/v1/projects/test-project/databases/(default)/documents/book?documentId='));
      assert.equal(options.method, 'POST');
      const fields = JSON.parse(options.body).fields;
      assert.equal(fields.id.stringValue, decodeURIComponent(url.split('documentId=')[1]));
      assert.equal(fields.order.integerValue, String(calls - 1));
      assert((fields.rating.doubleValue ?? Number(fields.rating.integerValue)) >= 0);
      if (process.env.SEED_TEST === 'failure' && calls === 3) return {ok:false,status:403,json:async()=>({error:{status:'PERMISSION_DENIED'}})};
      return { ok: calls > 1, status: calls === 1 ? 409 : 200 };
    };
  `);
  const env = { ...process.env, EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'test-project', FIRESTORE_ACCESS_TOKEN: 'test-token' };
  function run(args = [], extra = {}) {
    return spawnSync(process.execPath, ['--import', mock, 'scripts/seed-books.mjs', ...args], { env: { ...env, ...extra }, encoding: 'utf8' });
  }
  const dry = run(); assert.equal(dry.status, 0, dry.stderr); assert.match(dry.stdout, /No writes made/);
  const seeded = run(['--write']); assert.equal(seeded.status, 0, seeded.stderr); assert.match(seeded.stdout, /24 created; 1 existing/);
  const failed = run(['--write'], { SEED_TEST: 'failure' }); assert.notEqual(failed.status, 0); assert.match(failed.stderr, /Created 1; existing 1/);
  console.log('PASS: dry run, 25 book documents and types, preserve existing data, stop/report on permission failure. No network or cloud writes.');
} finally { await rm(dir, { recursive: true, force: true }); }
