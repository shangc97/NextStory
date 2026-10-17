/** Read-only cloud setup diagnostics. Does not create accounts or documents. */
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
if (!apiKey?.trim() || !projectId?.trim()) {
  console.error('Firebase config is missing. Fill in .env.local using .env.example.');
  process.exit(1);
}
let needsSetup = false;
async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  const body = await response.json();
  return { status: response.status, error: body.error?.message ?? '' };
}
try {
  const auth = await request(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `nextstory-setup-check-${Date.now()}@example.invalid`,
      password: 'invalid-probe-password', returnSecureToken: true,
    }),
  });
  if (['INVALID_LOGIN_CREDENTIALS', 'EMAIL_NOT_FOUND', 'INVALID_PASSWORD'].includes(auth.error)) {
    console.log('PASS: Email/password endpoint is available (nonexistent account rejected).');
  } else {
    needsSetup = true;
    if (auth.error.includes('CONFIGURATION_NOT_FOUND') || auth.error.includes('OPERATION_NOT_ALLOWED')) {
      console.error('SETUP NEEDED: Open Authentication and enable the Email/Password provider.');
    } else {
      console.error(`AUTH CHECK FAILED: HTTP ${auth.status} ${auth.error}`);
    }
  }
  const firestore = await request(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/books/nextstory-setup-check`);
  if (firestore.status === 403 && firestore.error === 'Missing or insufficient permissions.') {
    console.log('PASS: Firestore endpoint is available and this unauthenticated request is denied.');
  } else {
    needsSetup = true;
    if (/API has not been used|disabled/i.test(firestore.error)) {
      console.error('SETUP NEEDED: Create the default Cloud Firestore database in the Firebase console.');
    } else if (/database.*does not exist/i.test(firestore.error)) {
      console.error('SETUP NEEDED: Create the (default) Cloud Firestore database.');
    } else if (firestore.status === 200 || firestore.status === 404) {
      console.error('RULES CHECK NEEDED: The unauthenticated request was not denied. Publish firestore.rules.');
    } else {
      console.error(`FIRESTORE CHECK FAILED: HTTP ${firestore.status} ${firestore.error}`);
    }
  }
  console.log(`Project console: https://console.firebase.google.com/project/${projectId}/overview`);
  console.log('These checks do not verify authenticated reads/writes or all security rules. Follow docs/firebase-setup.md for the app test.');
  process.exitCode = needsSetup ? 1 : 0;
} catch (error) {
  console.error(`Network check failed: ${error.cause?.code ?? error.message}`);
  process.exitCode = 1;
}
