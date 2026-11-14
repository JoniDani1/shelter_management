// Makes a Google account an admin of the operator page (works before its first login).
// The email is passed on the command line and stored only in Firestore, never in the repo.
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/set-admin.js someone@gmail.com
//   ... node scripts/set-admin.js --remove someone@gmail.com
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const args = process.argv.slice(2);
const remove = args.includes('--remove');
const email = args.find((a) => a.includes('@'))?.trim().toLowerCase();
if (!email) {
  console.error('Usage: node scripts/set-admin.js [--remove] <google-email>');
  process.exit(1);
}

const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0099418772';
initializeApp({ credential: applicationDefault(), projectId });
const ref = getFirestore().collection('adminEmails').doc(email);

(remove ? ref.delete() : ref.set({ addedAt: FieldValue.serverTimestamp() }))
  .then(() => console.log(`${remove ? 'Removed' : 'Added'} admin ${email} in project ${projectId}.`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
