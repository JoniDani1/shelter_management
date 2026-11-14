# Tonight

Live free-bed board for Berlin night shelters. Shelters report free beds with a plus/minus page; a departure-board style display (for U-Bahn stations) shows the current availability of all shelters live.

> Hackathon prototype. The shelters in `data/seed.json` are real Berlin night shelters from the Berliner Kältehilfe list (November 2026, see `docs/kaeltehilfe-shelters.md`). The free-bed numbers are sample values, not live data.

## Live

- Board: https://tonight-berlin.web.app/board/
- Operators: https://tonight-berlin.web.app/operator/
- Map (public, mobile): https://tonight-berlin.web.app/map/

Hosted on Firebase Hosting, data in Cloud Firestore (`europe-west3`, collection `shelters`), GCP project `gen-lang-client-0099418772`.

## Run it locally

Requires Node.js 20+.

```bash
npm install
npm start
```

- Public board: http://localhost:3000/board/
- Public map: http://localhost:3000/map/
- Operator page: http://localhost:3000/operator/ (add `?shelter=mitte` to show only one shelter)

Open both side by side: every plus/minus press on the operator page shows up on the board immediately.

The local server has no login: everyone may edit every shelter.

To try the real login and security rules locally, run `npm run emulators` (needs Java) and open http://localhost:5050/operator/. The pages detect `localhost` and use the Auth and Firestore emulators; seed them with `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed:firestore`.

`npm test` runs the API and status-rule tests, `npm run test:rules` the Firestore security rules tests (starts the emulator). Settings live in `.env` (see `.env.example`); never commit `.env` or any key file.

## How it works

```
public/
  board/       Public display (full-screen, 16:9, scales with the screen; stacks on phones)
  map/         Public Google Map with live status per shelter (read-only, mobile-first)
  operator/    Plus/minus page for shelter staff
  shared/
    status.js      Availability rules (Available / Limited / Full / Closed / Unknown)
    data.js            Picks the data source: local server if /api exists, otherwise Firestore
    data-local.js      Local dev server (REST + Server-Sent Events)
    data-firestore.js  Firestore (onSnapshot for live updates, transactions for plus/minus)
    firebase-config.js Public Firebase web app config (not a secret)
src/           Local dev server (Express, in-memory store). Not used in production.
scripts/seed-firestore.js  Writes data/seed.json into Firestore
firestore.rules            Security rules
data/seed.json 26 real night shelters (sample free-bed numbers)
```

Availability rules follow the concept in [`docs/berlin-shelter-board-concept.md`](https://github.com/JoniDani1/shelter_management/blob/Status-Table/docs/berlin-shelter-board-concept.md) (branch `Status-Table`):

| Condition | Board shows |
| --- | --- |
| 5 or more free beds | Available (green) |
| 1 to 4 free beds | Limited (amber) |
| 0 free beds | Full (red) |
| Admissions closed | Closed, count hidden |
| Not updated for `STALE_AFTER_MINUTES` (default 30) | Unknown, count hidden |

Operators press **Confirm count** when the number is still correct, so the row does not go stale.

### Shelter fields

`id`, `name`, `district`, `totalBeds`, `freeBeds`, `admits` (`all` / `women` / `men`), `opensAt`, `closesAt`, `admissionOpen`, `updatedAt`. Address and location (for the map in stage 2) will be added with real shelter data.

## Deploy (Firebase)

Needs the Firebase CLI (`npm i -g firebase-tools`) and Google credentials with access to the project (`GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`, never commit the key).

```bash
npm run seed:firestore    # (re)write the shelters, reset their counts, delete removed ones
npm run deploy:firebase   # deploys public/ to Firebase Hosting and firestore.rules
```

Merges to `main` deploy automatically via GitHub Actions, and every pull request gets a preview URL. See [docs/deployment.md](docs/deployment.md).

### Operator login and security rules

- The **board** is public and needs no login.
- The **operator page** requires **Sign in with Google** (Firebase Auth). On first sign-in the operator picks the shelter they run (search, grouped by district); it is saved in `members/{uid}` and they land on it next time. "Change shelter" switches it. There is no approval step yet, so any Google account can pick any shelter.
- **Admins** may edit every shelter. An account is admin if a document `adminEmails/{its email}` exists (works before the first login). Add one with `npm run set-admin -- someone@gmail.com` (admin credentials needed). Never put admin emails in the repo.
- **Rules** (`firestore.rules`): anyone can read shelters. A signed-in account may change only the shelter saved for it (admins: all), and only `freeBeds` (0 to `totalBeds`), `admissionOpen`, `updatedAt` (server time), `updatedBy` (own uid) and `lastHistoryId`.
- **History:** every change also writes `shelters/{id}/history/{entry}` (`kind`, `delta`, `freeBeds`, `totalBeds`, `admissionOpen`, `by`, `at`) in the same transaction; the rules reject a change without its entry. This feeds later features such as "usually full from about 21:30".

`members/{uid}` keeps `role` and a `shelterIds` list so an approval step or several shelters per account can be added without changing the data structure.

## Alternative: container

The `Dockerfile` runs the local server (in-memory data, one instance). It was used on Cloud Run before Firebase was set up and is kept as a fallback.

## Shelter management

The management screen is included on this branch alongside the public board. See the [management guide and screenshot](docs/shelter-management.md) for shelter selection, plus/minus controls, count confirmation and admission controls.
