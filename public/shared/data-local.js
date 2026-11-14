// Client data source for the local dev server (REST + Server-Sent Events).
//
// Both pages only talk to window.TonightData, never to fetch() directly, so the
// backend can be swapped (e.g. for a Firestore implementation using onSnapshot
// and transactions) by loading a different data-*.js file with the same API:
//
//   getConfig()                         -> Promise<{ staleAfterMinutes, demo }>
//   subscribe(onShelters, onConnection) -> unsubscribe fn
//        onShelters(shelters[])  on first load and every change
//        onConnection(bool)      true = live, false = connection lost
//   adjustFreeBeds(id, delta)           -> Promise<shelter>  (clamped to 0..totalBeds)
//   confirm(id)                         -> Promise<shelter>  (count still correct, bumps updatedAt)
//   setAdmissionOpen(id, open)          -> Promise<shelter>
//   resetDemo()                         -> Promise<void>
(function () {
  async function call(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  window.TonightData = {
    getConfig: () => call('GET', '/api/config'),
    subscribe(onShelters, onConnection = () => {}) {
      const source = new EventSource('/api/stream');
      source.addEventListener('shelters', (e) => {
        onConnection(true);
        onShelters(JSON.parse(e.data));
      });
      // EventSource reconnects by itself; we only report the state.
      source.onerror = () => onConnection(false);
      return () => source.close();
    },
    adjustFreeBeds: (id, delta) => call('POST', `/api/shelters/${encodeURIComponent(id)}/adjust`, { delta }),
    confirm: (id) => call('POST', `/api/shelters/${encodeURIComponent(id)}/confirm`),
    setAdmissionOpen: (id, open) => call('PUT', `/api/shelters/${encodeURIComponent(id)}/admission`, { open }),
    resetDemo: () => call('POST', '/api/reset'),
  };
})();
