// In-memory shelter store. State lives only as long as the server process.
//
// Every store implementation (memory now, Firestore later) exposes the same
// small async interface so the rest of the app does not care where data lives:
//
//   list()                        -> Promise<Shelter[]>
//   adjustFreeBeds(id, delta)     -> Promise<Shelter>
//   setFreeBeds(id, value)        -> Promise<Shelter>
//   confirm(id)                   -> Promise<Shelter>   (re-confirm count, bumps updatedAt)
//   setAdmissionOpen(id, open)    -> Promise<Shelter>
//   reset()                       -> Promise<void>      (reload seed data)
//   subscribe(listener)           -> unsubscribe fn     (listener(shelters) on every change)

const { EventEmitter } = require('node:events');
const seed = require('../../data/seed.json');

class StoreError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function createMemoryStore() {
  const events = new EventEmitter();
  events.setMaxListeners(0);
  let shelters = new Map();

  function load() {
    const now = new Date().toISOString();
    shelters = new Map(
      seed.map((s) => [s.id, { ...s, admissionOpen: true, updatedAt: now }])
    );
  }

  function snapshot() {
    return [...shelters.values()].map((s) => ({ ...s }));
  }

  function emit() {
    events.emit('change', snapshot());
  }

  function get(id) {
    const shelter = shelters.get(id);
    if (!shelter) throw new StoreError(404, `Unknown shelter: ${id}`);
    return shelter;
  }

  function update(id, fn) {
    const shelter = get(id);
    fn(shelter);
    shelter.updatedAt = new Date().toISOString();
    emit();
    return { ...shelter };
  }

  function validCount(shelter, value) {
    if (!Number.isInteger(value)) throw new StoreError(400, 'Bed count must be an integer');
    if (value < 0 || value > shelter.totalBeds) {
      throw new StoreError(400, `Bed count must be between 0 and ${shelter.totalBeds}`);
    }
    return value;
  }

  load();

  return {
    async list() {
      return snapshot();
    },
    async adjustFreeBeds(id, delta) {
      if (!Number.isInteger(delta)) throw new StoreError(400, 'delta must be an integer');
      const shelter = get(id);
      // Clamp instead of failing so fast button presses at the edges are harmless.
      const next = Math.min(shelter.totalBeds, Math.max(0, shelter.freeBeds + delta));
      return update(id, (s) => { s.freeBeds = next; });
    },
    async setFreeBeds(id, value) {
      const shelter = get(id);
      const next = validCount(shelter, value);
      return update(id, (s) => { s.freeBeds = next; });
    },
    async confirm(id) {
      return update(id, () => {});
    },
    async setAdmissionOpen(id, open) {
      if (typeof open !== 'boolean') throw new StoreError(400, 'open must be true or false');
      return update(id, (s) => { s.admissionOpen = open; });
    },
    async reset() {
      load();
      emit();
    },
    subscribe(listener) {
      events.on('change', listener);
      return () => events.off('change', listener);
    },
  };
}

module.exports = { createMemoryStore, StoreError };
