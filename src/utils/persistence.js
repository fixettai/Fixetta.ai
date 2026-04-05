
// Simple localStorage wrapper (since we can't use window.persistentStorage in some envs)
export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch(e) { console.warn('Storage error:', e); }
  },
  get: (key) => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch(e) { return null; }
  },
  remove: (key) => {
    localStorage.removeItem(key);
  }
};
