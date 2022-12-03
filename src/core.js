const { RESOURCES_ROOT, SITE, VERSION } = require('./config/sites.js');
const { COLLECTED_IDS, CollectIDs } = require('./util/collect-ids.js');
const { AddStyle, WaitForElement, GEBI, QSA } = require('./util/dom.js');
const FetchCachedNames = require('./util/fetch-cached-names.js');
const CACHED_NAMES_STORAGE = require('./util/storage.js');
const { BuildTooltips } = require('./util/tooltips.js');

WaitForElement('body').then(() => {
  if (!GEBI('container-for-custom-elements-0')) {
    const container = document.createElement('div');
    container.id = 'container-for-custom-elements-0';
    container.dataset.author = 'serguun42';

    document.body.appendChild(container);
  }
});

AddStyle(`${RESOURCES_ROOT}osnova-cacher-names.css`, 0, 'osnova');

const WatchStorageChange = () => {
  let previousStorageSize = Object.keys(CACHED_NAMES_STORAGE).length;

  setInterval(() => {
    const newStorageSize = Object.keys(CACHED_NAMES_STORAGE).length;

    if (newStorageSize && newStorageSize !== previousStorageSize) {
      previousStorageSize = newStorageSize;
      BuildTooltips();
    }
  }, 100);
};

const WatchCollectedIDsChange = () => {
  let previousCollectedIDsSetSize = 0;

  setInterval(() => {
    const newCollectedIDsSetSize = COLLECTED_IDS.size;

    if (newCollectedIDsSetSize && newCollectedIDsSetSize !== previousCollectedIDsSetSize) {
      const tempOldSize = previousCollectedIDsSetSize;
      previousCollectedIDsSetSize = newCollectedIDsSetSize;

      FetchCachedNames()
        .then((cachedNames) => {
          if (!Object.keys(cachedNames || {}).length)
            return Promise.reject(new Error('<cachedNames> is empty or null'));

          Object.keys(cachedNames).forEach((userId) => {
            CACHED_NAMES_STORAGE[userId] = cachedNames[userId];
          });

          return Promise.resolve();
        })
        .catch(() => {
          previousCollectedIDsSetSize = tempOldSize;
        });
    }
  }, 100);
};

const WatchURLChange = () => {
  let previousPath = window.location.pathname;

  setInterval(() => {
    const newPath = window.location.pathname;

    if (newPath !== previousPath) {
      previousPath = newPath;
      CollectIDs();
      BuildTooltips();
    }
  }, 100);
};

new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    const { addedNodes, removedNodes, target, nextSibling, previousSibling } = mutation;
    const mutatedNodes = [...addedNodes, ...removedNodes, target, nextSibling, previousSibling];

    mutatedNodes.forEach((mutatedNode) => {
      if (!(mutatedNode instanceof HTMLElement)) return;

      if (
        ['comment', 'subsite-card', 'content-header', 'v-header', 'table__row', 'feed__chunk'].some((checkingClass) =>
          mutatedNode.classList.contains(checkingClass)
        )
      ) {
        CollectIDs();
        BuildTooltips();
      }
    });
  });
}).observe(document, {
  childList: true,
  subtree: true,
});

window.addEventListener('load', () => {
  setTimeout(() => {
    const PARTS = [
      `${RESOURCES_ROOT}final.css`,
      // eslint-disable-next-line no-underscore-dangle
      `?id=${window.__delegated_data?.['module.auth']?.id || 0}`,
      // eslint-disable-next-line no-underscore-dangle
      `&name=${encodeURIComponent(window.__delegated_data?.['module.auth']?.name || 0)}`,
      `&site=${SITE}`,
      `&version=${VERSION}`,
    ];

    AddStyle(PARTS.join(''), 0);
  });

  CollectIDs();
  WatchURLChange();
  WatchStorageChange();
  WatchCollectedIDsChange();
});

window.addEventListener('click', () =>
  QSA('.site-names__list').forEach((listElem) => listElem.classList.remove('active'))
);
