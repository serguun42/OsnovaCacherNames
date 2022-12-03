/** @type {import("../../types").CachedNames} */
const CACHED_NAMES_STORAGE = {};

if (process.env.NODE_ENV === 'development') {
  window.CACHED_NAMES_STORAGE = {
    get values() {
      return CACHED_NAMES_STORAGE;
    },
    get size() {
      return Object.keys(CACHED_NAMES_STORAGE).length;
    },
  };
}

module.exports = CACHED_NAMES_STORAGE;
