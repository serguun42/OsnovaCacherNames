/**
 * Query selector
 *
 * @param {string} query
 * @returns {HTMLElement}
 */
const QS = (query) => document.querySelector(query);

/**
 * Query selector all
 *
 * @param {string} query
 * @returns {HTMLElement[]}
 */
const QSA = (query) => Array.from(document.querySelectorAll(query));

/**
 * Get element by ID
 *
 * @param {string} query
 * @returns {HTMLElement}
 */
const GEBI = (query) => document.getElementById(query);

/**
 * Remove element
 *
 * @param {HTMLElement} elem
 * @returns {void}
 */
const GR = (elem) => elem?.remove?.();

/**
 * @typedef {Object} ObserverQueueItem
 * @property {string} [tag]
 * @property {string} [id]
 * @property {string} [className]
 * @property {{name: string, value: string}} [attribute]
 * @property {ObserverQueueItem} [parent]
 * @property {ObserverQueueItem} [not]
 * @property {(foundElem: HTMLElement) => void} resolver
 */
/** @type {ObserverQueueItem[]} */
const observerQueue = [];

const mainObserber = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    const { addedNodes, removedNodes, target, nextSibling, previousSibling } = mutation;
    const mutatedNodes = [...addedNodes, ...removedNodes, target, nextSibling, previousSibling];

    /**
     * @param {ObserverQueueItem} waitingElemSelector
     * @param {HTMLElement} addedNode
     * @returns {boolean}
     */
    const LocalCheckNode = (waitingElemSelector, addedNode) => {
      if (!(addedNode instanceof HTMLElement)) return false;

      let atLeastOneMatch = false;

      if (waitingElemSelector.tag) {
        if (waitingElemSelector.tag === addedNode.tagName.toLowerCase()) atLeastOneMatch = true;
        else return false;
      }

      if (waitingElemSelector.id) {
        if (waitingElemSelector.id === addedNode.id) atLeastOneMatch = true;
        else return false;
      }

      if (waitingElemSelector.className) {
        if (addedNode.classList.contains(waitingElemSelector.className)) atLeastOneMatch = true;
        else return false;
      }

      if (waitingElemSelector.attribute?.name) {
        if (addedNode.getAttribute(waitingElemSelector.attribute.name) === waitingElemSelector.attribute.value)
          atLeastOneMatch = true;
        else return false;
      }

      if (!atLeastOneMatch) return false;

      if (waitingElemSelector.not) {
        const notCheck = LocalCheckNode(waitingElemSelector.not, addedNode);
        if (notCheck) return false;
      }

      if (waitingElemSelector.parent) {
        const parentCheck = LocalCheckNode(waitingElemSelector.parent, addedNode.parentElement || addedNode.parentNode);
        return parentCheck;
      }

      return true;
    };

    observerQueue.forEach((waitingElemSelector, waitingElemIndex, waitingElemsArr) => {
      const foundNode = Array.from(mutatedNodes).find((addedNode) => LocalCheckNode(waitingElemSelector, addedNode));

      if (!foundNode) return;

      if (waitingElemSelector.resolver) waitingElemSelector.resolver(foundNode);

      waitingElemsArr.splice(waitingElemIndex, 1);
    });
  });
});

mainObserber.observe(document, {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false,
});

const INTERVALS_COUNTERS = {
  created: 0,
  deleted: 0,
};

if (process.env.NODE_ENV === 'development')
  window.S42_INTERVALS_COUNTERS = () => {
    // eslint-disable-next-line no-console
    console.warn(`INTERVALS_COUNTERS: ${JSON.stringify(INTERVALS_COUNTERS, false, '\t')}`);
  };

/**
 * @param {() => void} callback
 * @param {number} delay
 * @returns {number}
 */
const SetCustomInterval = (callback, delay) => {
  if (!callback || !delay) return -1;

  ++INTERVALS_COUNTERS.created;
  return setInterval(callback, delay);
};

/**
 * @param {number} intervalID
 */
const ClearCustomInterval = (intervalID) => {
  if (intervalID < 0) return;

  try {
    clearInterval(intervalID);
    ++INTERVALS_COUNTERS.deleted;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(e);
  }
};

/**
 * @param {string | ObserverQueueItem} key
 * @param {Promise} [waitAlways]
 * @returns {Promise<HTMLElement>}
 */
const WaitForElement = (key, waitAlways) => {
  const existing = QS(key);
  if (existing) return Promise.resolve(existing);

  /**
   * @param {string} fullSingleQuery
   * @returns {Promise<HTMLElement>}
   */
  const LocalWaitUntilSignleElem = (fullSingleQuery) => {
    /**
     * @param {string} subSingleQuery
     * @returns {ObserverQueueItem | null}
     */
    const LocalBuildObserverQueueItem = (subSingleQuery) => {
      if (!subSingleQuery) return null;

      const parentMatch = subSingleQuery.match(/^(?<parent>.*)(?:\s>\s)(?<child>[^>]+)$/);
      if (parentMatch) subSingleQuery = parentMatch.groups?.child;

      const tagName = subSingleQuery.split(/#|\.|\[/)[0];
      const id = subSingleQuery.match(/#([\w-]+)/i)?.[1];
      const className = subSingleQuery.match(/\.([\w-]+(\.[\w-]+)*)/)?.[1];
      const attributeMatch =
        subSingleQuery.match(/\[(?<attributeName>[\w-]+)=(["'])(?<attributeValue>[^"']+)\2\]/i) || [];

      /** @type {ObserverQueueItem} */
      const observerQueueSubItem = {};
      if (tagName) observerQueueSubItem.tag = tagName;
      if (id) observerQueueSubItem.id = id;
      if (className) observerQueueSubItem.className = className;
      if (attributeMatch[1] && attributeMatch[2])
        observerQueueSubItem.attribute = {
          name: attributeMatch?.groups?.attributeName,
          value: attributeMatch?.groups?.attributeValue,
        };

      if (parentMatch) observerQueueSubItem.parent = LocalBuildObserverQueueItem(parentMatch.groups?.parent);

      return observerQueueSubItem;
    };

    const selectorMainPart = fullSingleQuery.split(':not(')[0];
    const selectorNotPart = fullSingleQuery.split(':not(')[1]?.slice(0, -1);
    const selectorForQueue = LocalBuildObserverQueueItem(selectorMainPart);

    if (selectorNotPart) selectorForQueue.not = LocalBuildObserverQueueItem(selectorNotPart);

    return new Promise((resolve) => {
      observerQueue.push({
        ...selectorForQueue,
        resolver: resolve,
      });

      setTimeout(() => {
        const foundQueueItemIndex = observerQueue.findIndex(({ resolver }) => resolver === resolve);

        if (foundQueueItemIndex < 0) return;

        observerQueue.splice(foundQueueItemIndex, 1);

        let intervalCounter = 0;
        const backupInterval = SetCustomInterval(() => {
          const found = QS(fullSingleQuery);

          if (found) {
            ClearCustomInterval(backupInterval);
            resolve(found);
            return;
          }

          if (++intervalCounter > 50 && !waitAlways) {
            ClearCustomInterval(backupInterval);
            resolve(null);
            return;
          }

          if (waitAlways && waitAlways instanceof Promise)
            waitAlways
              .then(() => {
                ClearCustomInterval(backupInterval);
                return resolve(null);
              })
              .catch(() => {});
        }, 300);
      }, 1e3);
    });
  };

  return Promise.race(key.split(', ').map(LocalWaitUntilSignleElem));
};

/** @type {{ [customElementName: string]: HTMLElement }} */
const CUSTOM_ELEMENTS = {};

/**
 * @param {string} link
 * @param {number} priority
 * @param {string} [moduleName]
 */
const AddStyle = (link, priority, moduleName = '') => {
  const stylesNode = document.createElement('link');
  stylesNode.setAttribute('data-priority', priority);
  stylesNode.setAttribute('data-author', 'serguun42');
  stylesNode.setAttribute('rel', 'stylesheet');
  stylesNode.setAttribute('href', link);

  if (moduleName) {
    WaitForElement('body').then((body) => {
      if (body) body.classList.add(`s42-${moduleName.replace(/^osnova_/, '').replace(/_/g, '-')}`);
    });
  }

  WaitForElement(`#container-for-custom-elements-${priority}`).then(
    /** @param {HTMLElement} containerToPlace */ (containerToPlace) => {
      if (!containerToPlace) return;

      containerToPlace.appendChild(stylesNode);
      CUSTOM_ELEMENTS[link] = stylesNode;
    }
  );
};

module.exports = {
  QS,
  QSA,
  GEBI,
  GR,
  SetCustomInterval,
  ClearCustomInterval,
  WaitForElement,
  CUSTOM_ELEMENTS,
  AddStyle,
};
