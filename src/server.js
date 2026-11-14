const path = require('node:path');
const express = require('express');
const { createStore, StoreError } = require('./store');

const PORT = Number(process.env.PORT) || 3000;
const STALE_AFTER_MINUTES = Number(process.env.STALE_AFTER_MINUTES) || 30;

function createApp(store) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Small wrapper so store errors become proper HTTP responses.
  const handle = (fn) => async (req, res) => {
    try {
      res.json(await fn(req, res));
    } catch (err) {
      const status = err instanceof StoreError ? err.status : 500;
      if (status === 500) console.error(err);
      res.status(status).json({ error: err.message });
    }
  };

  app.get('/api/config', (req, res) => {
    res.json({ staleAfterMinutes: STALE_AFTER_MINUTES, demo: true });
  });

  app.get('/api/shelters', handle(() => store.list()));

  app.post('/api/shelters/:id/adjust', handle((req) =>
    store.adjustFreeBeds(req.params.id, req.body?.delta)));

  app.put('/api/shelters/:id/free-beds', handle((req) =>
    store.setFreeBeds(req.params.id, req.body?.freeBeds)));

  app.post('/api/shelters/:id/confirm', handle((req) =>
    store.confirm(req.params.id)));

  app.put('/api/shelters/:id/admission', handle((req) =>
    store.setAdmissionOpen(req.params.id, req.body?.open)));

  app.post('/api/reset', handle(async () => {
    await store.reset();
    return { ok: true };
  }));

  // Live updates via Server-Sent Events: sends the full list on connect and on every change.
  app.get('/api/stream', async (req, res) => {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();
    const send = (shelters) => res.write(`event: shelters\ndata: ${JSON.stringify(shelters)}\n\n`);
    send(await store.list());
    const unsubscribe = store.subscribe(send);
    // Comment line keeps proxies from closing an idle connection.
    const keepAlive = setInterval(() => res.write(': ping\n\n'), 25000);
    req.on('close', () => {
      clearInterval(keepAlive);
      unsubscribe();
    });
  });

  app.get('/', (req, res) => res.redirect('/board/'));

  return app;
}

if (require.main === module) {
  const store = createStore();
  createApp(store).listen(PORT, () => {
    console.log(`Tonight is running on http://localhost:${PORT}`);
    console.log(`  Public board:  http://localhost:${PORT}/board/`);
    console.log(`  Operator page: http://localhost:${PORT}/operator/`);
  });
}

module.exports = { createApp };
