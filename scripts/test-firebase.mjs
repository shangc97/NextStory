/** Live smoke test: temporary Auth accounts and activity docs, removed in finally. */
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase/app';
import { createUserWithEmailAndPassword, deleteUser, getAuth, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, onSnapshot, orderBy, query, serverTimestamp, setDoc, terminate, where, writeBatch } from 'firebase/firestore';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
assert(config.apiKey && config.projectId && config.appId, 'Fill in .env.local before running the test.');
const accounts = [];
const suffix = randomBytes(8).toString('hex');
const bookId = `setup-check-${suffix}`;
async function account(index) {
  const app = initializeApp(config, `setup-check-${suffix}-${index}`);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const entry = { app, auth, db, email: `nextstory-check-${suffix}-${index}@example.com`, password: randomBytes(24).toString('base64url'), user: null, docs: [] };
  accounts.push(entry);
  entry.user = (await createUserWithEmailAndPassword(auth, entry.email, entry.password)).user;
  return entry;
}
async function denied(operation) {
  await assert.rejects(operation, (error) => error.code === 'permission-denied');
}
function nextSnapshot(reference, predicate, operation) {
  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    const timeout = setTimeout(() => { unsubscribe(); reject(new Error('Snapshot timed out.')); }, 20000);
    const finish = (error) => { clearTimeout(timeout); unsubscribe(); error ? reject(error) : resolve(); };
    unsubscribe = onSnapshot(reference, (snapshot) => {
      if (!snapshot.metadata.hasPendingWrites && predicate(snapshot)) finish();
    }, finish);
    Promise.resolve().then(operation).catch(finish);
  });
}
let failed = false;
try {
  const first = await account(1);
  await updateProfile(first.user, { displayName: 'NextStory setup check' });
  await signOut(first.auth);
  await signInWithEmailAndPassword(first.auth, first.email, first.password);
  assert.equal(first.auth.currentUser.uid, first.user.uid);
  assert.equal(first.auth.currentUser.displayName, 'NextStory setup check');
  console.log('PASS: Signup, display name, logout and email/password login.');

  assert.equal((await getDoc(doc(first.db, 'users', first.user.uid))).exists(), false);
  console.log('PASS: Own profile path can be read before profile creation.');

  if (process.env.EXPO_PUBLIC_FIRESTORE_BOOKS_ENABLED === 'true') {
    const catalogue = await getDocs(query(collection(first.db, 'book'), orderBy('order')));
    assert(catalogue.size >= 25, 'Import the 25 sample books before running this check.');
    const dune = catalogue.docs.find((item) => item.id === 'dune');
    assert(dune, 'Expected the original sample book ID to be preserved.');
    assert.equal(dune.data().title, 'Dune');
    assert.equal(dune.data().order, 0);
    await denied(() => setDoc(doc(first.db, 'book', bookId), { title: 'Unauthorized' }));
    await denied(() => deleteDoc(doc(first.db, 'book', 'dune')));
    console.log('PASS: Authenticated catalogue reads, preserved sample IDs/order, and rejected client writes/deletes.');
  }

  const saved = doc(first.db, 'users', first.user.uid, 'savedBooks', bookId);
  const swipe = doc(first.db, 'users', first.user.uid, 'swipes', bookId);
  first.docs.push(saved, swipe);
  await nextSnapshot(saved, (snapshot) => snapshot.exists(), () => setDoc(saved, { bookId, createdAt: serverTimestamp() }));
  assert.equal((await getDoc(saved)).data().bookId, bookId);
  assert((await getDocs(collection(first.db, 'users', first.user.uid, 'savedBooks'))).docs.some((item) => item.id === bookId));
  console.log('PASS: Saved book write, read, collection query and realtime snapshot.');

  await setDoc(swipe, { bookId, direction: 'like', updatedAt: serverTimestamp() });
  assert.equal((await getDoc(swipe)).data().direction, 'like');
  await setDoc(swipe, { bookId, direction: 'skip', updatedAt: serverTimestamp() });
  assert.equal((await getDoc(swipe)).data().direction, 'skip');
  await denied(() => setDoc(swipe, { bookId, direction: 'invalid', updatedAt: serverTimestamp() }));
  console.log('PASS: Like/skip persistence and invalid direction rejected.');

  const second = await account(2);
  await denied(() => getDoc(doc(second.db, 'users', first.user.uid, 'savedBooks', bookId)));
  await denied(() => setDoc(doc(second.db, 'users', first.user.uid, 'swipes', bookId), { bookId, direction: 'like', updatedAt: serverTimestamp() }));
  await denied(() => getDocs(collection(second.db, 'users', first.user.uid, 'savedBooks')));
  await denied(() => getDoc(doc(second.db, 'users', first.user.uid)));
  console.log('PASS: Another account cannot read/write/query the first account’s private data.');

  if (process.env.EXPO_PUBLIC_FIRESTORE_LIKES_ENABLED === 'true') {
    const like = doc(first.db, 'like', `${first.user.uid}_${bookId}`);
    first.docs.push(like);
    const fields = { userId: first.user.uid, bookId, updatedAt: serverTimestamp() };
    const createLike = writeBatch(first.db);
    createLike.set(swipe, { bookId, direction: 'like', updatedAt: serverTimestamp() });
    createLike.set(like, fields);
    const ownLikes = query(collection(first.db, 'like'), where('userId', '==', first.user.uid));
    await nextSnapshot(ownLikes, (snapshot) => snapshot.docs.some((item) => item.id === like.id), () => createLike.commit());
    assert.equal((await getDoc(swipe)).data().direction, 'like');
    // Repeated likes replace the same record rather than adding duplicates.
    await setDoc(like, fields);
    assert.equal((await getDocs(ownLikes)).size, 1);
    assert((await getDocs(query(collection(first.db, 'like'), where('userId', '==', first.user.uid)))).docs.some((item) => item.id === like.id));
    await denied(() => getDoc(doc(second.db, 'like', like.id)));
    await denied(() => getDocs(query(collection(second.db, 'like'), where('userId', '==', first.user.uid))));
    await denied(() => setDoc(doc(second.db, 'like', like.id), fields));
    await denied(() => deleteDoc(doc(second.db, 'like', like.id)));
    await denied(() => setDoc(like, { ...fields, extra: true }));
    await denied(() => setDoc(doc(first.db, 'like', `wrong-${bookId}`), fields));
    const batch = writeBatch(first.db);
    batch.set(swipe, { bookId, direction: 'skip', updatedAt: serverTimestamp() });
    batch.delete(like);
    await batch.commit();
    assert.equal((await getDoc(swipe)).data().direction, 'skip');
    assert(!(await getDocs(ownLikes)).docs.some((item) => item.id === like.id));
    const absentDelete = writeBatch(first.db);
    absentDelete.set(swipe, { bookId, direction: 'skip', updatedAt: serverTimestamp() });
    absentDelete.delete(like);
    await absentDelete.commit();

    // A rejected like must not leave the user's swipe record changed alone.
    const rejectedLike = writeBatch(first.db);
    rejectedLike.set(swipe, { bookId, direction: 'like', updatedAt: serverTimestamp() });
    rejectedLike.set(like, { ...fields, extra: true });
    await denied(() => rejectedLike.commit());
    assert.equal((await getDoc(swipe)).data().direction, 'skip');
    assert.equal((await getDocs(ownLikes)).size, 0);

    // Removing a liked book clears both the user record and top-level record.
    const relike = writeBatch(first.db);
    relike.set(swipe, { bookId, direction: 'like', updatedAt: serverTimestamp() });
    relike.set(like, fields);
    await relike.commit();
    const removeLike = writeBatch(first.db);
    removeLike.delete(swipe);
    removeLike.delete(like);
    await removeLike.commit();
    assert.equal((await getDoc(swipe)).exists(), false);
    assert.equal((await getDocs(ownLikes)).size, 0);
    console.log('PASS: Like realtime subscription, deterministic IDs, owner queries, schema validation, account isolation and atomic like/skip/removal.');
    console.log('PASS: A rejected like batch leaves the user swipe and like collection unchanged.');
  }

  await signOut(second.auth);
  await denied(() => getDoc(doc(second.db, 'users', first.user.uid, 'savedBooks', bookId)));
  console.log('PASS: Signed-out requests are denied.');
  if (process.env.EXPO_PUBLIC_FIRESTORE_BOOKS_ENABLED === 'true') {
    await denied(() => getDocs(collection(second.db, 'book')));
    console.log('PASS: Signed-out catalogue query is denied.');
  }
  if (process.env.EXPO_PUBLIC_FIRESTORE_LIKES_ENABLED === 'true') {
    await denied(() => getDocs(query(collection(second.db, 'like'), where('userId', '==', first.user.uid))));
    console.log('PASS: Signed-out like query is denied.');
  }

  await deleteDoc(saved);
  await deleteDoc(swipe);
  assert.equal((await getDoc(saved)).exists(), false);
  assert.equal((await getDoc(swipe)).exists(), false);
  console.log('PASS: Owner can remove saved books and swipe records.');
  console.log('Profile document creation and on-device session persistence still need the app signup test. No users/{uid} profile document is created by this test.');
} catch (error) {
  failed = true;
  console.error(`FAIL: ${error.code ?? error.name}: ${error.message}`);
} finally {
  for (const entry of accounts.reverse()) {
    try {
      if (entry.user) {
        await signInWithEmailAndPassword(entry.auth, entry.email, entry.password);
        for (const reference of entry.docs) await deleteDoc(reference);
        await deleteUser(entry.auth.currentUser);
        console.log('CLEANUP: Temporary activity documents and Auth account removed.');
      }
    } catch (error) {
      failed = true;
      console.error(`CLEANUP FAILED for ${entry.email}: ${error.code ?? error.message}. Remove only this test account and its users/${entry.user?.uid ?? '(not created)'} activity manually.`);
    } finally {
      await terminate(entry.db);
      await deleteApp(entry.app);
    }
  }
  process.exitCode = failed ? 1 : 0;
}
