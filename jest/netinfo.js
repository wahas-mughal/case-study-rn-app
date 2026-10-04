const listeners = new Set();

module.exports = {
  addEventListener(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emit() {
    listeners.forEach(listener => {
      listener();
    });
  },
  fetch: async () => ({
    isConnected: true,
    isInternetReachable: true,
  }),
  refresh: async () => ({
    isConnected: true,
    isInternetReachable: true,
  }),
};
