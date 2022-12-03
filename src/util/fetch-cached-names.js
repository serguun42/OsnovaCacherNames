const { NAMES_CACHER_API_URL } = require('../config/sites.js');
const { COLLECTED_IDS } = require('./collect-ids.js');
const CACHED_NAMES_STORAGE = require('./storage.js');

const SECOND = 1000;

let cacherNamesFetchTimeout = false;
/**
 * @returns {Promise<import("../../types").CachedNames>}
 */
const FetchCachedNames = () => {
  if (cacherNamesFetchTimeout || !COLLECTED_IDS.size) return Promise.resolve({});

  cacherNamesFetchTimeout = true;
  setTimeout(() => {
    cacherNamesFetchTimeout = false;
  }, SECOND);

  const existingIds = Object.keys(CACHED_NAMES_STORAGE).map((userId) => parseInt(userId));
  /** @type {number[]} */
  const idsToFetch = Array.from(COLLECTED_IDS)
    .map((id) => parseInt(id))
    .filter((id) => !existingIds.includes(id) && !existingIds.includes(id.toString()) && !!id);
  if (!idsToFetch.length) return Promise.resolve({});

  return fetch(NAMES_CACHER_API_URL, {
    method: 'POST',
    body: JSON.stringify(idsToFetch),
  })
    .then((res) => {
      if (res.status === 200) return res.json();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText}`));
    })
    .then(
      /** @param {import("../../types").CachedNames} cachedNames */ (cachedNames) => {
        if (!cachedNames || typeof cachedNames !== 'object') return Promise.reject(new Error(`No <cachedNames>`));

        return Promise.resolve(cachedNames);
      }
    )
    .catch((e) => {
      cacherNamesFetchTimeout = true;
      setTimeout(() => {
        cacherNamesFetchTimeout = false;
      }, 60 * SECOND);

      // eslint-disable-next-line no-console
      console.warn(e);
      return Promise.resolve({});
    });
};

module.exports = FetchCachedNames;
