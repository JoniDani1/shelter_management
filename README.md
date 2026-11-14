# Tonight

Live free-bed board for Berlin night shelters. Shelters report free beds with a plus/minus page; a departure-board style display (for U-Bahn stations) shows the current availability of all shelters live.

> Hackathon prototype. All shelters and numbers in `data/seed.json` are fictional sample data.

## Run it locally

Requires Node.js 20+.

```bash
npm install
npm start
```

- Public board: http://localhost:3000/board/
- Operator page: http://localhost:3000/operator/ (add `?shelter=mitte` to show only one shelter)

Open both side by side: every plus/minus press on the operator page shows up on the board immediately.

`npm test` runs the API and status-rule tests. Settings live in `.env` (see `.env.example`); never commit `.env` or any key file.

## How it works

```
public/
  board/       Public display (full-screen, 16:9, scales with the screen; stacks on phones)
  operator/    Plus/minus page for shelter staff
  shared/
    status.js      Availability rules (Available / Limited / Full / Closed / Unknown)
    data-local.js  Browser data source for the local server (REST + Server-Sent Events)
src/
  server.js    Small Express server: static files, JSON API, live stream at /api/stream
  store/       Server-side store (in memory for now)
data/seed.json 8 sample shelters with 20, 30 or 40 beds
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

## Moving to Firebase

The planned target is Firebase Hosting + Firestore (no own server). The pages only talk to `window.TonightData` (defined in `public/shared/data-local.js`), so the switch is:

1. Enable Firestore in the Google Cloud project and add Firebase to it.
2. Add `public/shared/data-firestore.js` with the same API: `onSnapshot` on the `shelters` collection for `subscribe`, a transaction clamped to `0..totalBeds` for `adjustFreeBeds`, `serverTimestamp()` for `updatedAt`.
3. Load that file instead of `data-local.js` in both `index.html` files, and seed Firestore from `data/seed.json`.
4. Deploy `public/` with Firebase Hosting. `src/` is then only needed for local development.
