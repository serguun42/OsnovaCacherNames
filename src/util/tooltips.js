const { QSA, QS, GR } = require('./dom.js');
const CACHED_NAMES_STORAGE = require('./storage.js');

/**
 * @param {string} id
 * @param {string} skipName
 * @param {boolean} isBig
 * @param {boolean} [isTinyOnMobile]
 * @param {string} [buttonHTML]
 * @returns {HTMLElement}
 */
const CreateGenericTooltip = (id, skipName, isBig, isTinyOnMobile = false, buttonHTML = '') => {
  if (!CACHED_NAMES_STORAGE[id]) return null;

  const namesForTooltip = CACHED_NAMES_STORAGE[id].filter((name) => name !== skipName);
  if (!namesForTooltip || !namesForTooltip.length) return null;

  const tooltip = document.createElement('div');
  tooltip.className = isBig ? 'site-names site-names--big' : 'site-names';

  const namesList = document.createElement('div');
  namesList.className = 'site-names__list';
  namesList.innerHTML = `<div class="site-names__list__header">Также известен как:</div>${namesForTooltip
    .map((name) => `<div class="site-names__list__name">${name}</div>`)
    .join('')}`;
  namesList.addEventListener('click', (e) => e.stopPropagation());

  tooltip.appendChild(namesList);

  const toggleButton = document.createElement('div');
  toggleButton.className = isBig
    ? `v-button v-button--default v-button--size-default ${isTinyOnMobile ? 'v-button--mobile-size-tiny' : ''}`
    : 'site-names__toggle';
  if (isBig && buttonHTML) toggleButton.innerHTML = buttonHTML;

  toggleButton.addEventListener('click', (e) => {
    e.stopPropagation();

    namesList.classList.add('active');

    if (namesList.classList.contains('site-names__list--compressed'))
      namesList.style.top = `${e.target?.getBoundingClientRect()?.bottom || e.clientY}px`;

    QSA('.site-names__list').forEach((listElem) => {
      if (listElem !== namesList) listElem.classList.remove('active');
    });
  });

  tooltip.appendChild(toggleButton);

  return tooltip;
};

/**
 * @param {string} id
 * @param {string} [skipName]
 * @returns {HTMLElement}
 */
const CreateSmallTooltip = (id, skipName = '') => CreateGenericTooltip(id, skipName, false);

/**
 * @param {string} id
 * @param {string} [skipName]
 * @param {boolean} [isTinyOnMobile]
 * @returns {HTMLElement}
 */
const CreateBigTooltip = (id, skipName = '', isTinyOnMobile = false) =>
  CreateGenericTooltip(
    id,
    skipName,
    true,
    isTinyOnMobile,
    `<div class="v-button__icon">\
    <svg height="18" width="48" class="icon icon--quote-right"><use xlink:href="#quote-right"></use></svg></div>`
  );

/**
 * @param {HTMLElement} tooltip
 * @returns {void}
 */
const CorrectTooltip = (tooltip) => {
  /** @type {HTMLElement} */
  const list = tooltip.querySelector('.site-names__list');
  if (!list) return;

  const { left, right, top } = list.getBoundingClientRect();

  if (left < 16) {
    list.classList.add('site-names__list--compressed');
    list.style.top = `${top}px`;
    list.style.left = '16px';
    list.style.maxWidth = 'calc(100vw - 32px)';
  }

  if (right > window.innerWidth - 16) {
    list.classList.add('site-names__list--compressed');
    list.style.top = `${top}px`;
    list.style.removeProperty('left');
    list.style.right = '16px';
    list.style.maxWidth = 'calc(100vw - 32px)';
  }
};

const BuildTooltips = () => {
  /** Comments */
  QSA('.comment[data-user_id]').forEach((comment) => {
    const userId = parseInt(comment?.dataset?.user_id);
    if (!userId) return;

    const userLink = comment.querySelector('.comment__author');
    if (!userLink) return;

    const skipName = userLink.innerText?.trim();
    const tooltip = CreateSmallTooltip(userId, skipName);
    if (!tooltip) return;

    if (userLink.classList.contains('s42-user-cacher-names-seen')) return;
    userLink.classList.add('s42-user-cacher-names-seen');

    userLink.after(tooltip);
    CorrectTooltip(tooltip);
  });

  /** Author and subsite line in post header (post page and feed) */
  QSA(
    '.content-header .content-header-author [href*="/u/"], .content-header .content-header-author [href*="/s/"]'
  ).forEach((authorElem) => {
    const authorId = parseInt(authorElem?.getAttribute('href')?.match(/\/[us]\/(?<authorId>\d+)/)?.groups?.authorId);
    if (!authorId) return;

    const skipName =
      authorElem.querySelector('.content-header-author__name')?.innerText?.trim() || authorElem.innerText?.trim();
    const tooltip = CreateSmallTooltip(authorId, skipName);
    if (!tooltip) return;

    if (authorElem.classList.contains('s42-user-cacher-names-seen')) return;
    authorElem.classList.add('s42-user-cacher-names-seen');

    authorElem.after(tooltip);
    CorrectTooltip(tooltip);
  });

  /** Rating table */
  QSA('.table__row .table__cell .subsite[href*="/u/"], .table__row .table__cell .subsite[href*="/s/"]').forEach(
    (ratingElem) => {
      const ratingId = parseInt(ratingElem.getAttribute('href').match(/\/[us]\/(?<ratingId>\d+)/)?.groups?.ratingId);
      if (!ratingId) return;

      const skipName = ratingElem.querySelector('.subsite__name')?.innerText?.trim();
      const tooltip = CreateSmallTooltip(ratingId, skipName);
      if (!tooltip) return;

      if (ratingElem.classList.contains('s42-user-cacher-names-seen')) return;
      ratingElem.classList.add('s42-user-cacher-names-seen');

      ratingElem.after(tooltip);
      CorrectTooltip(tooltip);
    }
  );

  /** Profile/blog pages (even if there is no profile header with big cover) */
  const profileId = parseInt(window.location.pathname.match(/\/[us]\/(?<profileId>\d+)/)?.groups?.profileId);
  const profileHeader = QS('.v-header');
  if (profileHeader && profileId) {
    /**
     * @param {HTMLElement} headerButtons
     * @returns {void}
     */
    const LocalPlaceHeaderNames = (headerButtons) => {
      if (!headerButtons) return;

      const skipName = QS('.v-header-title__name')?.innerText?.trim();
      const tooltip = CreateBigTooltip(profileId, skipName, false);
      if (!tooltip) return;

      if (headerButtons.classList.contains('s42-user-cacher-names-seen')) return;
      headerButtons.classList.add('s42-user-cacher-names-seen');

      const etcControlButton = headerButtons.querySelector('.etc_control');
      if (etcControlButton) {
        etcControlButton.before(tooltip);
        CorrectTooltip(tooltip);
        return;
      }

      const userHeaderActionsLastButton = Array.from(headerButtons.querySelectorAll('.v-button')).pop();
      if (userHeaderActionsLastButton) {
        userHeaderActionsLastButton.after(tooltip);
        CorrectTooltip(tooltip);
        return;
      }

      headerButtons.append(tooltip);
      CorrectTooltip(tooltip);
    };

    const headerButtons = QS('.v-header__actions, .v-header-actions');
    if (headerButtons) LocalPlaceHeaderNames(headerButtons);
    else {
      const createdHeaderButtons = document.createElement('div');
      createdHeaderButtons.className = 'v-header__actions v-header-actions';
      createdHeaderButtons.style.position = 'absolute';
      createdHeaderButtons.style.right = getComputedStyle(profileHeader).paddingRight;
      createdHeaderButtons.style.top = getComputedStyle(profileHeader).paddingTop;

      const headerStats = QS('.v-header__stats');
      if (headerStats) {
        headerStats.before(createdHeaderButtons);
        LocalPlaceHeaderNames(createdHeaderButtons);
      }
    }
  }

  /** Subsite card at the bottom of the posts */
  const subsiteCard = QS('.subsite-card');
  const subsiteCardId = parseInt(
    new URL(
      QS('.subsite-card__author-info a[href].subsite-card-title__item')?.getAttribute('href') || '',
      window.location.origin
    ).pathname.match(/\/[us]\/(?<cardId>\d+)/)?.groups?.cardId
  );
  if (subsiteCard && subsiteCardId) {
    const skipName = QS('.subsite-card-title__item--name')?.innerText?.trim();
    const tooltip = CreateBigTooltip(subsiteCardId, skipName, true);
    if (!tooltip) return;

    if (subsiteCard.classList.contains('s42-user-cacher-names-seen')) return;
    subsiteCard.classList.add('s42-user-cacher-names-seen');

    const subsiteCardActions =
      subsiteCard.querySelector('.subsite-card__actions') || subsiteCard.appendChild(document.createElement('div'));
    if (!subsiteCardActions.classList.contains('subsite-card__actions'))
      subsiteCardActions.classList.add('subsite-card__actions');

    Array.from(subsiteCardActions.querySelectorAll('.v-button__label')).forEach((label) => GR(label));

    subsiteCardActions.prepend(tooltip);
    CorrectTooltip(tooltip);
  }
};

module.exports = {
  BuildTooltips,
  CreateBigTooltip,
  CreateSmallTooltip,
  CorrectTooltip,
};
