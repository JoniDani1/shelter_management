// Access control for the local dev server: no login, everyone may edit every shelter.
export default {
  needsLogin: false,
  onUser(callback) {
    callback({ uid: 'local', name: 'Local development', email: null, photoURL: null });
    return () => {};
  },
  async signIn() {},
  async signOut() {},
  watchAccess(user, callback) {
    callback({ role: 'admin', shelterIds: [] });
    return () => {};
  },
  async chooseShelter() {},
};
