/** Run in Google Cloud Shell (gcloud login) or pass FIRESTORE_ACCESS_TOKEN. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const books = JSON.parse(await readFile(new URL('../src/data/books.seed.json', import.meta.url), 'utf8'));
const project = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
assert(project, 'Set EXPO_PUBLIC_FIREBASE_PROJECT_ID to the intended Firebase project.');
assert.equal(books.length, new Set(books.map((book) => book.id)).size, 'Duplicate book IDs.');
for (const book of books) {
  assert.match(book.id, /^[a-z0-9-]+$/);
  for (const field of ['title', 'author', 'genre', 'hook', 'description']) assert.equal(typeof book[field], 'string');
  for (const field of ['rating', 'year', 'coverId']) assert(Number.isFinite(book[field]));
}
console.log(`Target: ${project} / book; ${books.length} sample books (ratings remain sample values).`);
if (!process.argv.includes('--write')) {
  console.log('Validation passed. No writes made. Add --write to create missing books; existing documents are never overwritten.');
  process.exit(0);
}
let token = process.env.FIRESTORE_ACCESS_TOKEN;
if (!token) {
  try { token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { throw new Error('Admin authentication required. Run in Google Cloud Shell with project access, or provide FIRESTORE_ACCESS_TOKEN securely in the environment. Never put a token in app source.'); }
}
const root = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
let created = 0, existing = 0;
for (const [order, book] of books.entries()) {
  const fields = Object.fromEntries(Object.entries({ ...book, order }).map(([key, value]) => [key,
    typeof value === 'string' ? { stringValue: value } : Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }]));
  const result = await fetch(`${root}/book?documentId=${encodeURIComponent(book.id)}`, { method: 'POST', headers, body: JSON.stringify({ fields }), signal: AbortSignal.timeout(30000) });
  if (result.status === 409) { existing++; continue; }
  if (!result.ok) {
    const body = await result.json();
    throw new Error(`Import stopped at ${book.id}: ${result.status} ${body.error?.status ?? ''}. Created ${created}; existing ${existing}. Safe to rerun; existing documents are preserved.`);
  }
  created++;
}
console.log(`Complete: ${created} created; ${existing} existing documents preserved. No users or activity were changed.`);
