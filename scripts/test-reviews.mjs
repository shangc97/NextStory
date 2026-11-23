/** Offline checks of the actual review validation and Firestore service, without cloud writes. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function load(file, modules = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'exports', code)((name) => {
    assert(name in modules, `Unexpected dependency: ${name}`);
    return modules[name];
  }, exports);
  return exports;
}

const model = load('src/data/reviews.ts');
for (const rating of [null, 0, 6, 1.5, NaN]) assert(model.validateReview(rating, 'Review'));
assert(model.validateReview(5, ' \n '));
assert(model.validateReview(5, 'x'.repeat(2001)));
assert.equal(model.validateReview(1, 'x'.repeat(2000)), null);
assert.equal(model.averageReviewRating([]), null);
assert.equal(model.averageReviewRating([{ rating: 2 }, { rating: 5 }]), 3.5);

const auth = { currentUser: { uid: 'reader-a' } };
const writes = [];
let acknowledge;
let rejectWrite;
let listener;
let listenerError;
let unsubscribed = false;
class Timestamp { constructor(value) { this.value = value; } toMillis() { return this.value; } }
const service = load('src/services/reviews.ts', {
  '@/data/reviews': model,
  '@/services/firebase': { requireFirebase: () => ({ auth, db: {} }) },
  'firebase/firestore': {
    Timestamp,
    collection: (_db, ...path) => path.join('/'),
    doc: (collection, uid) => `${collection}/${uid}`,
    serverTimestamp: () => 'SERVER_TIMESTAMP',
    setDoc: (path, data) => {
      writes.push({ path, data });
      return new Promise((resolve, reject) => { acknowledge = resolve; rejectWrite = reject; });
    },
    onSnapshot: (_ref, options, next, error) => {
      assert.equal(options.includeMetadataChanges, true);
      listener = next;
      listenerError = error;
      return () => { unsubscribed = true; };
    },
  },
});

for (const id of ['dune', 'google:volume-1', 'openlibrary:OL1W']) {
  let complete = false;
  const save = service.saveBookReview(id, 4, '  My review  ').then(() => { complete = true; });
  await Promise.resolve();
  assert.equal(complete, false, 'A queued local write must not report success.');
  assert.equal(writes.at(-1).path, `books/${id}/reviews/reader-a`);
  assert.deepEqual(writes.at(-1).data, { rating: 4, content: 'My review', updatedAt: 'SERVER_TIMESTAMP' });
  acknowledge();
  await save;
  assert.equal(complete, true);
}
const failed = service.saveBookReview('dune', 2, 'Keep this draft');
rejectWrite({ code: 'permission-denied' });
await assert.rejects(failed, (error) => error.code === 'permission-denied');
const count = writes.length;
await assert.rejects(() => service.saveBookReview('dune', null, 'Review'), /rating/);
await assert.rejects(() => service.saveBookReview('dune', 4, '  '), /Write a review/);
await assert.rejects(() => service.saveBookReview('bad/id', 4, 'Review'), /identifier/);
auth.currentUser = null;
await assert.rejects(() => service.saveBookReview('dune', 4, 'Review'), /Sign in/);
assert.equal(writes.length, count, 'Invalid or signed-out submissions must not write.');

const updates = [];
const errors = [];
const stop = service.subscribeToBookReviews('dune', (reviews, cached) => updates.push({ reviews, cached }), (error) => errors.push(error));
const entry = (id, rating, updatedAt) => ({ id, data: () => ({ rating, content: id, updatedAt: new Timestamp(updatedAt) }) });
listener({ metadata: { hasPendingWrites: false, fromCache: true }, empty: true, docs: [] });
listener({ metadata: { hasPendingWrites: true, fromCache: false }, empty: false, docs: [entry('draft', 5, 30)] });
assert.equal(updates.length, 0, 'Empty cache and unconfirmed writes must not become published reviews.');
listener({ metadata: { hasPendingWrites: false, fromCache: false }, empty: false, docs: [entry('old', 3, 10), entry('new', 5, 20), entry('invalid', 9, 30)] });
assert.deepEqual(updates[0].reviews.map((review) => review.userId), ['new', 'old']);
assert.equal(updates[0].reviews[0].updatedAt, 20);
assert.equal(updates[0].cached, false);
listener({ metadata: { hasPendingWrites: false, fromCache: false }, empty: true, docs: [] });
assert.equal(updates.at(-1).reviews.length, 0, 'A confirmed empty server collection must show the empty state.');
listenerError({ code: 'permission-denied' });
assert.equal(errors[0].code, 'permission-denied');
stop();
assert(unsubscribed);
console.log('PASS: review validation, averages, authenticated paths, trimmed writes, server acknowledgements, rejected saves, cache/pending handling, ordering and listener cleanup.');
