const { QSA, QS } = require('./dom.js');

/** @type {Set<number>} */
const COLLECTED_IDS = new Set();
/**
 * Saves all IDs to collectedIDs
 */
const CollectIDs = () => {
  /** Comments */
  QSA('.comment[data-user_id]').forEach((comment) => {
    const userId = parseInt(comment?.dataset?.user_id);
    if (!userId) return;

    COLLECTED_IDS.add(userId);
  });

  /** Author and subsite line in post header (post page and feed) */
  QSA(
    '.content-header .content-header-author [href*="/u/"], .content-header .content-header-author [href*="/s/"]'
  ).forEach((authorElem) => {
    const authorId = parseInt(authorElem?.getAttribute('href')?.match(/\/[us]\/(?<authorId>\d+)/)?.groups?.authorId);
    if (!authorId) return;

    COLLECTED_IDS.add(authorId);
  });

  /** Rating table */
  QSA('.table__row .table__cell .subsite[href*="/u/"], .table__row .table__cell .subsite[href*="/s/"]').forEach(
    (ratingElem) => {
      const ratingId = parseInt(ratingElem.getAttribute('href').match(/\/[us]\/(?<ratingId>\d+)/)?.groups?.ratingId);
      if (!ratingId) return;

      COLLECTED_IDS.add(ratingId);
    }
  );

  /** Profile/blog pages (even if there is no profile header with big cover) */
  const profileId = parseInt(window.location.pathname.match(/\/[us]\/(?<profileId>\d+)/)?.groups?.profileId);
  if (profileId) COLLECTED_IDS.add(profileId);

  /** Subsite card at the bottom of the posts */
  const subsiteCardId = parseInt(
    new URL(
      QS('.subsite-card__author-info a[href].subsite-card-title__item')?.getAttribute('href') || '',
      window.location.origin
    ).pathname.match(/\/[us]\/(?<cardId>\d+)/)?.groups?.cardId
  );
  if (subsiteCardId) COLLECTED_IDS.add(subsiteCardId);

  [NaN, 0, '0', -1, '-1'].forEach((wrongId) => COLLECTED_IDS.delete(wrongId));
};

module.exports = {
  COLLECTED_IDS,
  CollectIDs,
};
