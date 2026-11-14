// Security rules tests. Run with `npm run test:rules` (starts the Firestore emulator).
const test = require('node:test');
const { readFileSync } = require('node:fs');
const {
  initializeTestEnvironment, assertFails, assertSucceeds,
} = require('@firebase/rules-unit-testing');
const {
  doc, getDoc, setDoc, updateDoc, collection, runTransaction, serverTimestamp, getDocs,
} = require('firebase/firestore');

let env;

const ADMIN = { uid: 'admin1', email: 'boss@example.org' };
const OPERATOR = { uid: 'op1', email: 'op@example.org' };
const STRANGER = { uid: 'new1', email: 'new@example.org' };

function ctx(user) {
  return env.authenticatedContext(user.uid, { email: user.email, email_verified: true }).firestore();
}

// Same write as the app: shelter change + history entry in one transaction.
function change(db, uid, shelterId, fields, kind = 'adjust') {
  const ref = doc(db, 'shelters', shelterId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.data();
    const next = { ...cur, ...fields };
    const entry = doc(collection(ref, 'history'));
    tx.set(entry, {
      kind, delta: next.freeBeds - cur.freeBeds, freeBeds: next.freeBeds, totalBeds: cur.totalBeds,
      admissionOpen: next.admissionOpen, by: uid, at: serverTimestamp(),
    });
    tx.update(ref, { ...fields, updatedAt: serverTimestamp(), updatedBy: uid, lastHistoryId: entry.id });
  });
}

test.before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-tonight',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

test.beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    for (const id of ['mitte', 'kreuzberg']) {
      await setDoc(doc(db, 'shelters', id), {
        name: id, totalBeds: 20, freeBeds: 5, admissionOpen: true, order: 0,
      });
    }
    await setDoc(doc(db, 'adminEmails', ADMIN.email), { addedAt: new Date() });
    await setDoc(doc(db, 'members', OPERATOR.uid), {
      email: OPERATOR.email, name: 'Op', role: 'operator', shelterIds: ['mitte'],
    });
  });
});

test.after(async () => env.cleanup());

test('anyone can read shelters without login', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDocs(collection(db, 'shelters')));
});

test('signed-out users cannot write', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(change(db, 'x', 'mitte', { freeBeds: 4 }));
});

test('signed-in account without a chosen shelter cannot write', async () => {
  await assertFails(change(ctx(STRANGER), STRANGER.uid, 'mitte', { freeBeds: 4 }));
});

test('operator can change their own shelter, with history', async () => {
  const db = ctx(OPERATOR);
  await assertSucceeds(change(db, OPERATOR.uid, 'mitte', { freeBeds: 4 }));
  await assertSucceeds(change(db, OPERATOR.uid, 'mitte', {}, 'confirm'));
  await assertSucceeds(change(db, OPERATOR.uid, 'mitte', { admissionOpen: false }, 'admission'));
  const history = await getDocs(collection(db, 'shelters', 'mitte', 'history'));
  if (history.size !== 3) throw new Error(`expected 3 history entries, got ${history.size}`);
});

test('operator cannot change another shelter', async () => {
  await assertFails(change(ctx(OPERATOR), OPERATOR.uid, 'kreuzberg', { freeBeds: 4 }));
});

test('a change without history entry is rejected', async () => {
  const db = ctx(OPERATOR);
  await assertFails(updateDoc(doc(db, 'shelters', 'mitte'), {
    freeBeds: 4, updatedAt: serverTimestamp(), updatedBy: OPERATOR.uid,
  }));
});

test('out-of-range counts, other fields and wrong updatedBy are rejected', async () => {
  const db = ctx(OPERATOR);
  await assertFails(change(db, OPERATOR.uid, 'mitte', { freeBeds: 21 }));
  await assertFails(change(db, OPERATOR.uid, 'mitte', { freeBeds: -1 }));
  await assertFails(change(db, OPERATOR.uid, 'mitte', { name: 'x' }));
  await assertFails(change(db, 'someone-else', 'mitte', { freeBeds: 4 }));
});

test('admin (by email, before first login) can change any shelter', async () => {
  await assertSucceeds(change(ctx(ADMIN), ADMIN.uid, 'kreuzberg', { freeBeds: 1 }));
});

test('new account picks its own shelter, then can write only that one', async () => {
  const db = ctx(STRANGER);
  const ref = doc(db, 'members', STRANGER.uid);
  const base = { email: STRANGER.email, name: 'New', role: 'operator', updatedAt: serverTimestamp() };
  await assertFails(setDoc(ref, { ...base, role: 'admin', shelterIds: ['mitte'] }));
  await assertFails(setDoc(ref, { ...base, shelterIds: ['mitte', 'kreuzberg'] }));
  await assertFails(setDoc(ref, { ...base, shelterIds: ['does-not-exist'] }));
  await assertFails(setDoc(ref, { ...base, email: 'someone@else.org', shelterIds: ['mitte'] }));
  await assertSucceeds(setDoc(ref, { ...base, shelterIds: ['mitte'] }));
  await assertSucceeds(change(db, STRANGER.uid, 'mitte', { freeBeds: 4 }));
  await assertFails(change(db, STRANGER.uid, 'kreuzberg', { freeBeds: 4 }));
  // Change shelter: now kreuzberg is allowed and mitte is not.
  await assertSucceeds(updateDoc(ref, { shelterIds: ['kreuzberg'], updatedAt: serverTimestamp() }));
  await assertSucceeds(change(db, STRANGER.uid, 'kreuzberg', { freeBeds: 4 }));
  await assertFails(change(db, STRANGER.uid, 'mitte', { freeBeds: 3 }));
  await assertFails(updateDoc(ref, { role: 'admin' }));
});

test('another account cannot set my shelter', async () => {
  await assertFails(setDoc(doc(ctx(STRANGER), 'members', OPERATOR.uid), {
    email: STRANGER.email, name: 'x', role: 'operator', shelterIds: ['kreuzberg'], updatedAt: serverTimestamp(),
  }));
});

test('accounts cannot read other members or the admin list', async () => {
  const db = ctx(STRANGER);
  await assertFails(getDoc(doc(db, 'members', OPERATOR.uid)));
  await assertFails(getDocs(collection(db, 'members')));
  await assertFails(getDoc(doc(db, 'adminEmails', ADMIN.email)));
  await assertSucceeds(getDoc(doc(db, 'adminEmails', STRANGER.email)));
  await assertFails(setDoc(doc(db, 'adminEmails', STRANGER.email), { x: 1 }));
});

test('anyone can read the demo switch, nobody can write it from the app', async () => {
  const anon = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(anon, 'config', 'demo')));
  await assertFails(setDoc(doc(ctx(ADMIN), 'config', 'demo'), { enabled: false }));
});

