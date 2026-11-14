# Tonight frontend

React/Vite version of the Tonight UI (design proposal from branch `s3eed-UI/UX`), connected to the same Firebase backend as `/board/`, `/map/` and `/operator/`. Served at **/app/** on Firebase Hosting.

## Backend connection (this branch)

- **Shelters:** live from Firestore, collection `shelters` (26 real Kältehilfe night shelters), via `onSnapshot` in `src/services/shelterService.ts`. Free-bed numbers are still demo values and the UI says so.
- **Status rules:** same as the board (`src/services/status.ts`): 5+ available, 1–4 limited, 0 or admissions closed full, no update for 30 minutes unknown.
- **Worker login:** Google sign-in (Firebase Auth) in `src/services/authService.ts`, same flow as `/operator/`: the account picks its shelter once (`members/{uid}`), admins may edit every shelter.
- **Updates:** only the free-bed count can be changed (total capacity is fixed in the database). Every change writes a history entry in the same transaction, as `firestore.rules` require.
- **Build:** `npm run build` writes to `../public/app`; the GitHub workflows build it before deploying.
- The mock data, mock accounts and localStorage sync were removed. The Playwright tests in `tests/` still describe the mock flow and need rewriting.

The sections below describe the original mock prototype.

## Run

Requires Node.js 22.16+ (Node 22.23 used for verification).

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. `npm run build` creates `dist/`; `npm run preview` serves the production build. No API key or backend is needed. The working name is defined by `APP_NAME` in `src/App.tsx`; update the HTML title and storage prefix when renaming.

## Demonstration

Open **View Map**, then **Worker login**. Use either fictional account:

| Worker          | Email                      | Password | Assigned shelter |
| --------------- | -------------------------- | -------- | ---------------- |
| Anna Müller     | anna@demo-shelter.example  | Demo123! | Franklinstraße   |
| David Schneider | david@demo-shelter.example | Demo456! | Lehrter Straße   |

The login card can fill Anna's credentials. Change the available count and press **Update Availability**. Drafts do not affect the map. Saving updates the assigned shelter, timestamp, markers, details, aggregate counters, and chart. The account cannot select another shelter. Two tabs on the same origin synchronize via the browser storage event. Logout clears the in-memory authentication session; public access never requires login.

## Mandatory components

The actual upstream implementations were retrieved and adapted in `src/components/ui/`:

| Component                   | Upstream documentation                                | Adaptation                                                                                                              |
| --------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Text Morph                  | https://motion-primitives.com/docs/text-morph         | Stateful action labels, including persistent label inside Morph Button                                                  |
| Morphing Popover            | https://motion-primitives.com/docs/morphing-popover   | Marker/list details and worker panel; adds focus containment/restoration, Escape, and portal positioning                |
| Toolbar Expandable          | https://motion-primitives.com/docs/toolbar-expandable | Original measurement/height animation and selection logic; configurable search, filter and map control content          |
| Animated Number             | https://motion-primitives.com/docs/animated-number    | Hero, bed counts, markers and totals; reduced-motion spring jump                                                        |
| Spectrum Login Card         | https://ui.spectrumhq.in/docs/login                   | Retains staggered card/input/action structure; adds password and mock authentication; removes unsupported social signup |
| Spectrum Morph Button       | https://ui.spectrumhq.in/docs/morph-button            | Original async state machine, width morph, spinner and drawn status icons; Text Morph stays mounted across states       |
| Spectrum Animated SVG Chart | https://ui.spectrumhq.in/docs/animatedchart           | Original animated fill/stroke paths driven by labeled shelter availability instead of the decorative sample series      |

Source repositories: [Motion Primitives](https://github.com/ibelick/motion-primitives) (`components/core` and `hooks/useClickOutside.tsx`) and [Spectrum UI](https://github.com/arihantcodes/spectrum-ui) (`app/registry/login-card/logincard.tsx`, `components/spectrumui/morph-button.tsx`, `app/registry/animatedchart/animateddemo.tsx`). Upstream licenses are retained in `licenses/`. Motion Primitives documentation blocked automated browsing; sources were retrieved directly from its official repository.

## Data and backend handoff

- `src/types/models.ts`: shelter, worker, session, capacity, and statistic models.
- `src/data/mockShelters.ts`: ten real public shelter names, addresses, phone numbers, eligibility and opening hours; fictional capacity/occupancy fixtures and approximate address coordinates.
- `src/data/mockShelterWorkers.ts`: fictional credentials and fixed worker assignments. These are public demo fixtures, not authentication secrets.
- `src/data/officialStatistics.ts`: fixed historical population statistic, separate from editable availability.
- `src/services/shelterService.ts`: typed `ShelterService`, validation, simulated delay and optional localStorage persistence.
- `src/services/authService.ts`: typed `AuthService` and simulated authentication.
- `src/store/ShelterStore.tsx`: React Context holds the shared shelter records and session. All map/list, dashboard and chart components consume this source of truth.

Replace the service exports with implementations of the same async interfaces for API integration. Replace storage-event synchronization with the backend's subscription mechanism in the provider. Return server-authoritative records from updates. Enforce authentication and worker-to-shelter authorization on the server; client-side scoping is only a demo. Never deploy the mock credentials as production authentication. No backend, database, reservations, geolocation, or external authentication is implemented.

## Sources and accuracy

- [Berlin Senate statistics](https://www.berlin.de/sen/soziales/besondere-lebenssituationen/wohnungslose/statistik/): **6,032** people without accommodation in the first week of February 2024. This is a historical estimate, not a current count of missing beds. It never changes with shelter edits.
- [Berlin Kältehilfe](https://kaeltehilfe-berlin.de/), [November 2026 overnight shelter directory](https://kaeltehilfe-berlin.de/images/Ubersicht%20NUs%202026_November_____.pdf), checked 14 November 2026: real shelter contact/location and published admission/hour information. Check the directory for current operational details. Operator names are omitted when not verified. Wheelchair access is not confirmed for these fixtures, so that filter deliberately returns an explanatory empty state.
- Coordinates are approximate address placements and require verification before operational use. All capacities, occupied/available counts and saved timestamps are demonstration data. Unknown-state beds are excluded from the public availability total; the chart explicitly includes all fixture counts.
- Interactive Leaflet map uses standard OpenStreetMap tiles with visible contributor attribution. See the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/). No tile prefetching or offline caching. Use a suitable hosted tile provider at production scale.

## Verification

```sh
npm test
npm run test:e2e
npm run build
```

Unit tests cover negative, fractional, empty/NaN, inconsistent, full and zero-capacity values. Browser tests cover homepage → map → invalid credentials → assigned worker login → invalid draft → publish → same-tab and cross-tab marker update, details, Escape, mobile search/filter/list, and tile failure. Playwright uses installed Chrome on macOS when available and bundled Chromium elsewhere. Run `npx playwright install chromium` before browser tests if no supported browser is installed.

## Limitations

English interface only, following repository instructions. No live operational data. Approximate coordinates. Contact shelters before travelling. State is local to the browser/origin and is not a multi-user service; same-browser tab synchronization needs localStorage. Clearing `tonight:shelters:v1` resets the fixtures. Authentication deliberately ends on refresh. Map tiles and Google Fonts require network access, with a usable shelter list and system font fallbacks. Public OSM tiles may be rate limited. Public service deployment requires verified accessibility information, exact coordinates, security, operational verification, and a real data integration.
