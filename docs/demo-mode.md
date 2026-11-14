# Demo mode

For pitches and demos the bed counts must not turn grey ("Unknown") after 30 minutes without an update.

## How it works

- `config/demo` in Firestore: `{ enabled: true | false }`. Pages may read it, only admin credentials can write it.
- **While it is on, every page skips the 30-minute rule**: `/`, `/board/`, `/map/`, `/operator/` (via `getConfig()` in `public/shared/data-firestore.js`, read on page load) and `/app/` (live, via `subscribeDemoMode` in `frontend/src/services/shelterService.ts`). Counts stay visible however old they are; this alone is enough for a demo.
- Optional extra:
  Cloud Run job **`tonight-demo-refresh`** (`europe-west3`, image `europe-west3-docker.pkg.dev/gen-lang-client-0099418772/tonight/demo-refresh`) runs `node scripts/demo-mode.js refresh`: if demo mode is on, it sets `updatedAt` of every shelter to now (`updatedBy: "demo-mode"`). It does not change counts and writes no history entries.
  A Cloud Scheduler trigger every 10 minutes would make the "Updated" times look recent too (not set up).
- Operators keep updating counts with plus/minus as usual; their changes show up live. Pages keep their "Demo" labels.

## Commands

Need admin credentials (`GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`):

```bash
node scripts/demo-mode.js reset     # plausible demo counts for all shelters (mix of available, limited, full)
node scripts/demo-mode.js on        # turn demo mode on and refresh now
node scripts/demo-mode.js off       # turn it off: counts expire after 30 minutes again (pages pick it up on reload, /app/ live)
node scripts/demo-mode.js refresh   # what the scheduled job runs
```

To remove the automation entirely:

```bash
gcloud scheduler jobs delete tonight-demo-refresh --location=europe-west3
gcloud run jobs delete tonight-demo-refresh --region=europe-west3
```
