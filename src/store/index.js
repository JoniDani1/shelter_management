// Picks the data store. Swap in another implementation (e.g. Firestore) here;
// it only needs to provide the interface documented in ./memory.js.
const { createMemoryStore, StoreError } = require('./memory');

function createStore(kind = process.env.STORE || 'memory') {
  switch (kind) {
    case 'memory':
      return createMemoryStore();
    // case 'firestore':
    //   return require('./firestore').createFirestoreStore();
    default:
      throw new Error(`Unknown STORE "${kind}". Supported: memory`);
  }
}

module.exports = { createStore, StoreError };
