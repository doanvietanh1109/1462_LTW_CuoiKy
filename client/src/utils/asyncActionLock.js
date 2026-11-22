export const createAsyncActionLock = () => {
  const lockedIds = new Set();

  return {
    acquire(id) {
      if (lockedIds.has(id)) return false;
      lockedIds.add(id);
      return true;
    },
    release(id) {
      lockedIds.delete(id);
    },
    has(id) {
      return lockedIds.has(id);
    },
    snapshot() {
      return new Set(lockedIds);
    },
  };
};
