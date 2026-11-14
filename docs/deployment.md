# Deployment

Tonight deploys itself through GitHub Actions. Nobody needs to run `firebase deploy` by hand any more (it still works, see the README).

| Trigger | Workflow | What happens |
| --- | --- | --- |
| Push to `main` (merged pull request) | `.github/workflows/deploy.yml` | Runs `npm test`, then deploys `public/` to Firebase Hosting (site `tonight-berlin`) and `firestore.rules`. Live at https://tonight-berlin.web.app |
| Pull request opened or updated | `.github/workflows/preview.yml` | Runs `npm test`, then deploys the branch to a Firebase Hosting preview channel and comments the preview URL on the pull request. Previews expire after 7 days. |
| Manual | `deploy.yml` via **Actions → Deploy to Firebase → Run workflow** | Same as a push to `main`. |

If the tests fail, nothing is deployed.

## One-time setup

The repository needs one secret:

- **Name:** `FIREBASE_SERVICE_ACCOUNT`
- **Value:** the complete JSON key file of the deploy service account for GCP project `gen-lang-client-0099418772`.
- **Where:** repository **Settings → Secrets and variables → Actions → New repository secret** (only repository admins can do this).

Never commit the key file to the repository.

## Checking a deploy

- **Actions** tab on GitHub: each run of "Deploy to Firebase" shows green (deployed) or red (tests or deploy failed, with logs).
- The commit on `main` gets a green check mark, and the repository's **Environments → production** list shows the latest deploy.
- Firebase console → Hosting shows the release history of `tonight-berlin`.

## Caveats

- Preview channels share the live Firestore database. Changing bed counts on a preview operator page changes the real data.
- Data seeding (`npm run seed:firestore`) is not automated on purpose, because it resets live counts.
- Pull requests from forks get tests but no preview (GitHub does not pass secrets to them).
