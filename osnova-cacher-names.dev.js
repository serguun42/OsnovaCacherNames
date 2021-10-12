// ==UserScript==
// @name        Osnova Cacher Names
// @version     3.2.6-A (2021-10-12)
// @author      serguun42, qq
// @description Previous user's names from TJ Cache by qq (Rebuild by serguun42)
// @homepage    https://tjournal.ru/tag/osnovanamescacher
// @supportURL  https://tjournal.ru/m/99944
// @match       https://tjournal.ru/*
// @match       https://dtf.ru/*
// @icon        https://serguun42.ru/resources/osnova_icons/tj.site.logo_256x256.png
// @icon64      https://serguun42.ru/resources/osnova_icons/tj.site.logo_64x64.png
// @updateURL   https://serguun42.ru/tampermonkey/osnova-cacher-names/osnova-cacher-names.js
// @downloadURL https://serguun42.ru/tampermonkey/osnova-cacher-names/osnova-cacher-names.js
// @run-at      document-end
// @grant       none
// @namespace   https://names-cacher.serguun42.ru/
// @license     https://creativecommons.org/licenses/by-nc/4.0/legalcode
// ==/UserScript==



const
	SITE = window.location.hostname.split(".")[0],
	RESOURCES_DOMAIN = "serguun42.ru",
	API_URL = `https://names-cacher.serguun42.ru/${SITE}`,
	VERSION = "3.2.6";




/** @param {String} query @returns {HTMLElement} */ const QS = query => document.querySelector(query);
/** @param {String} query @returns {HTMLElement[]} */ const QSA = query => Array.from(document.querySelectorAll(query));
/** @param {String} query @returns {HTMLElement} */ const GEBI = query => document.getElementById(query);
/** @param {HTMLElement} elem @returns {void} */ const GR = elem => {
	if (elem instanceof HTMLElement)
		(elem.parentElement || elem.parentNode).removeChild(elem);
};



/**
 * @typedef {Object} ObserverQueueType
 * @property {String} [tag]
 * @property {String} [id]
 * @property {String} [className]
 * @property {{name: string, value: string}} [attribute]
 * @property {ObserverQueueType} [parent]
 * @property {(foundElem: HTMLElement) => void} resolver
 */
/** @type {ObserverQueueType[]} */
const observerQueue = [];

const mainObserber = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		const { addedNodes, removedNodes, target, nextSibling, previousSibling } = mutation;
		const mutatedNodes = [...addedNodes, ...removedNodes, target, nextSibling, previousSibling];


		/**
		 * @param {ObserverQueueType} waitingElemSelector
		 * @param {HTMLElement} addedNode
		 * @returns {Boolean}
		 */
		const LocalCheckNode = (waitingElemSelector, addedNode, iParent) => {
			if (!(addedNode instanceof HTMLElement)) return false;

			let atLeastOneMatch = false;

			if (waitingElemSelector.tag) {
				if (waitingElemSelector.tag === addedNode.tagName.toLowerCase())
					atLeastOneMatch = true;
				else
					return false;
			}

			if (waitingElemSelector.id) {
				if (waitingElemSelector.id === addedNode.id)
					atLeastOneMatch = true;
				else
					return false;
			}

			if (waitingElemSelector.className && waitingElemSelector.className) {
				if (addedNode.classList.contains(waitingElemSelector.className))
					atLeastOneMatch = true;
				else
					return false;
			}

			if (waitingElemSelector.attribute && waitingElemSelector.attribute.name) {
				const gotAttribute = addedNode.getAttribute(waitingElemSelector.attribute.name);

				if (gotAttribute === waitingElemSelector.attribute.value)
					atLeastOneMatch = true;
				else
					return false;
			}

			if (!atLeastOneMatch) return false;

			if (waitingElemSelector.parent) {
				const parentCheck = LocalCheckNode(waitingElemSelector.parent, addedNode.parentElement || addedNode.parentNode, 1);
				return parentCheck;
			} else
				return true;
		};


		observerQueue.forEach((waitingElemSelector, waitingElemIndex, waitingElemsArr) => {
			const foundNode = Array.from(mutatedNodes).find((addedNode) => LocalCheckNode(waitingElemSelector, addedNode));

			if (foundNode && waitingElemSelector.resolver) {
				waitingElemSelector.resolver(foundNode);
				waitingElemsArr.splice(waitingElemIndex, 1);
			}
		});
	});
});

mainObserber.observe(document, {
	childList: true,
	subtree: true,
	attributes: false,
	characterData: false
});

let createdIntervals = 0,
	deletedIntervals = 0;

/**
 * @param {() => void} iCallback
 * @param {Number} iDelay
 * @returns {Number}
 */
const GlobalSetInterval = (iCallback, iDelay) => {
	if (!iCallback || !iDelay) return -1;

	++createdIntervals;
	return setInterval(iCallback, iDelay);
}

/**
 * @param {Number} iIntervalID
 */
const GlobalClearInterval = iIntervalID => {
	if (iIntervalID < 0) return;

	try {
		clearInterval(iIntervalID);
		++deletedIntervals;
	} catch (e) {
		console.warn(e);
	}
}

/**
 * @param {String | ObserverQueueType} iKey
 * @returns {Promise<HTMLElement>}
 */
const GlobalWaitForElement = iKey => {
	if (typeof iKey == "object" && iKey.parent)
		return new Promise(() => {
			observerQueue.push({
				...iKey,
				resolver: resolve
			});
		});


	if (typeof iKey !== "string") return Promise.resolve(null);

	const existing = QS(iKey);
	if (existing) return Promise.resolve(existing);


	/**
	 * @param {String} iQuery
	 * @returns {Promise<HTMLElement>}
	 */
	const LocalWaitUntilSignleElem = (iQuery) => {
		const tagName = iQuery.split(/#|\.|\[/)[0],
			  id = iQuery.match(/#([\w\-]+)/i)?.[1],
			  className = iQuery.match(/\.([\w\-]+(\.[\w\-]+)*)/)?.[1],
			  attributeMatch = iQuery.match(/\[([\w\-]+)\=\"([^\"]+)\"\]/i) || [];

		/** @type {ObserverQueueType} */
		const selectorForQueue = {};
		if (tagName) selectorForQueue.tag = tagName;
		if (id) selectorForQueue.id = id;
		if (className) selectorForQueue.className = className;
		if (attributeMatch[1] && attributeMatch[2]) selectorForQueue.attribute = { name: attributeMatch[1], value: 	attributeMatch[2] };


		return new Promise((resolve) => {
			observerQueue.push({
				...selectorForQueue,
				resolver: resolve
			});


			setTimeout(() => {
				const foundQueueItemIndex = observerQueue.findIndex(({resolver}) => resolver === resolve);

				if (foundQueueItemIndex > -1) {
					observerQueue.splice(foundQueueItemIndex, 1);

					let intervalCounter = 0;
					const backupInterval = GlobalSetInterval(() => {
						const found = QS(iQuery);

						if (found) {
							GlobalClearInterval(backupInterval);
							return resolve(found);
						}

						if (++intervalCounter > 50) {
							GlobalClearInterval(backupInterval);
							return resolve(null);
						}
					}, 300);
				}
			}, 1e3);
		});
	};


	return Promise.race(iKey.split(", ").map(LocalWaitUntilSignleElem));
};



/** @type {Object.<string, HTMLElement>} */
const CACHER_NAMES_CUSTOM_ELEMENTS = {};

/**
 * @param {String} iLink
 * @param {Number} iPriority
 * @param {String} [iDataFor]
 */
const GlobalAddStyle = (iLink, iPriority, iDataFor = false) => {
	const stylesNode = document.createElement("link");
		  stylesNode.setAttribute("data-priority", iPriority);
		  stylesNode.setAttribute("data-author", "serguun42");
		  stylesNode.setAttribute("rel", "stylesheet");
		  stylesNode.setAttribute("href", iLink);


	if (iDataFor)
		stylesNode.setAttribute("data-for", iDataFor);
	else
		stylesNode.setAttribute("data-for", "site");


	GlobalWaitForElement(`#container-for-custom-elements-${iPriority}`).then((containerToPlace) => {
		if (containerToPlace) {
			containerToPlace.appendChild(stylesNode);
			CACHER_NAMES_CUSTOM_ELEMENTS[iLink] = stylesNode;
		}
	});
};



GlobalWaitForElement("body").then(() => {
	if (!GEBI("container-for-custom-elements-0")) {
		const container = document.createElement("div");
			  container.id = "container-for-custom-elements-0";
			  container.dataset.author = "serguun42";

		document.body.appendChild(container);
	}
});

GlobalAddStyle(`https://${RESOURCES_DOMAIN}/tampermonkey/osnova-cacher-names/osnova-cacher-names.css`, 0, "osnova");



/** @type {{[userID: string]: string[]}} */
const CACHER_NAMES_USERS_NICKS = {};
let CACHER_NAMES_TIMEOUT = false;


if (RESOURCES_DOMAIN === "localhost") {
	window.CACHER_NAMES = {
		CACHER_NAMES_CUSTOM_ELEMENTS: CACHER_NAMES_CUSTOM_ELEMENTS,
		CACHER_NAMES_TIMEOUT: () => CACHER_NAMES_TIMEOUT,
		CACHER_NAMES_USERS_NICKS,
		GlobalWaitForElement,
		observerQueue,
		GetIntervals: () => ({ createdIntervals, deletedIntervals })
	}
}

const GlobalSeeUnseenUsers = () => {
	const usersIDs = new Set();


	const comments = Array.from(
		QSA(`.comment[data-user_id]`))
		.filter((comment) => {
			if (!(comment.dataset && comment.dataset.user_id)) return false;

			usersIDs.add(comment.dataset.user_id);

			const commentSpaceWrapper = comment.querySelector(".comment__space:first-of-type > .comment__self"),
				  userLink = commentSpaceWrapper?.querySelector(".comment-user");

			if (!commentSpaceWrapper) return false;
			if (!userLink) return false;
			if (!userLink.dataset) return false;

			userLink.dataset.skipName = userLink.querySelector(".comment-user__name")?.innerText;

			return true;
		}
	);

	const authors = Array.from(
		QSA(`.content-header .content-header-author[href*="/u/"]`))
			.filter((authorElem) => {
				if (!(
					authorElem.getAttribute("href") &&
					authorElem.getAttribute("href").match(/\/u\/(\d+)/) &&
					authorElem.getAttribute("href").match(/\/u\/(\d+)/)[1]
				)) return false;

				const userId = authorElem.getAttribute("href").match(/\/u\/(\d+)/)[1];

				usersIDs.add(userId);

				if (authorElem.dataset) {
					authorElem.dataset.userId = userId;
					authorElem.dataset.skipName = authorElem?.querySelector(".content-header-author__name")?.innerText;
				}

				return true;
			}
	);

	const ratings = Array.from(
		QSA(`.table__row .table__cell .subsite[href*="/u/"]`))
			.filter((ratingElem) => {
				if (!(
					ratingElem.getAttribute("href") &&
					ratingElem.getAttribute("href").match(/\/u\/(\d+)/) &&
					ratingElem.getAttribute("href").match(/\/u\/(\d+)/)[1]
				)) return false;

				const userId = ratingElem.getAttribute("href").match(/\/u\/(\d+)/)[1];

				usersIDs.add(userId);

				if (ratingElem.dataset) {
					ratingElem.dataset.userId = userId;
					ratingElem.dataset.skipName = ratingElem?.querySelector(".subsite__name")?.innerText;
				}

				return true;
			}
	);

	let profileID;
	if (window.location.pathname.match(/\/u\/(\d+)/)) {
		if (!(window.location.pathname.match(/\/u\/(\d+)(-[^\/]+)?\/(\d+)/))) {
			profileID = window.location.pathname.match(/\/u\/(\d+)(-)?/)[1];
			usersIDs.add(profileID);
		}
	}

	const profileName = QS(".v-header-title__name")?.innerText;


	/**
	 * @param {String} id
	 * @param {String} [skipName]
	 * @returns {HTMLElement}
	 */
	const LocalCreateTooltip = (id, skipName = "") => {
		const namesForTooltip = CACHER_NAMES_USERS_NICKS[id].filter((name) => name !== skipName);
		if (!namesForTooltip || !namesForTooltip.length) return null;

		const wrapper = document.createElement("div");
			  wrapper.className = "site-names";

		const namesList = document.createElement("div");
			  namesList.className = "site-names__list";
			  namesList.innerHTML = `<b>Также известен как:</b><br>${namesForTooltip.join("<br>")}`;
			  namesList.addEventListener("click", (e) => e.stopPropagation());

		wrapper.appendChild(namesList);


		const toggleButton = document.createElement("div");
			  toggleButton.className = "site-names__toggle";
			  toggleButton.addEventListener("click", (e) => {
					e.stopPropagation();

					namesList.classList.add("active");

					if (namesList.classList.contains("site-names__list--compressed")) {
						namesList.style.top = (e.target ? e.target.getBoundingClientRect ? e.target.getBoundingClientRect().bottom : e.clientY :  e.clientY) + "px";
					};

					QSA(".site-names__list").forEach((listElem) => {
						if (listElem != namesList)
							listElem.classList.remove("active");
					});
			  });

		wrapper.appendChild(toggleButton);

		return wrapper;
	};

	/**
	 * @param {String} id
	 * @param {String} [skipName]
	 * @returns {HTMLElement}
	 */
	const LocalCreateRichTooltip = (id, skipName = "") => {
		const namesForTooltip = CACHER_NAMES_USERS_NICKS[id].filter((name) => name !== skipName);
		if (!namesForTooltip || !namesForTooltip.length) return null;

		const wrapper = document.createElement("div");
			  wrapper.className = "site-names";

		const namesList = document.createElement("div");
			  namesList.className = "site-names__list";
			  namesList.innerHTML = `<b>Также известен как:</b><br>${namesForTooltip.join("<br>")}`;
			  namesList.addEventListener("click", (e) => e.stopPropagation());

		wrapper.appendChild(namesList);


		const toggleButton = document.createElement("div");
			  toggleButton.className = "v-button v-button--default v-button--size-default";
			  toggleButton.innerHTML = `<div class="v-button__icon"><svg height="18" width="48" class="icon icon--quote-right"><use xlink:href="#quote-right"></use></svg></div>`;
			  toggleButton.addEventListener("click", (e) => {
					e.stopPropagation();

					namesList.classList.add("active");

					if (namesList.classList.contains("site-names__list--compressed")) {
						namesList.style.top = (e.target ? e.target.getBoundingClientRect ? e.target.getBoundingClientRect().bottom : e.clientY :  e.clientY) + "px";
					};

					QSA(".site-names__list").forEach((listElem) => {
						if (listElem != namesList)
							listElem.classList.remove("active");
					});
			  });

		wrapper.appendChild(toggleButton);

		return wrapper;
	};

	/**
	 * @param {HTMLElement} wrapper
	 * @returns {void}
	 */
	const LocalCorrectWrapper = wrapper => {
		const list = wrapper.querySelector(".site-names__list");
		if (!list) return;

		let { left, right, top } = list.getBoundingClientRect();

		let fixingFlag = false,
			propsToFix = {};

		if (left < 16) {
			fixingFlag = true;
			propsToFix.top = top + "px";
			propsToFix.left = "16px";
			propsToFix.maxWidth = "calc(100vw - 32px)";
		}

		if (right > window.innerWidth - 16) {
			fixingFlag = true;
			propsToFix.top = top + "px";
			propsToFix.left = "unset";
			propsToFix.right = "16px";
			propsToFix.maxWidth = "calc(100vw - 32px)";
		}

		if (fixingFlag) {
			list.classList.add("site-names__list--compressed");

			for (let key in propsToFix)
				list.style[key] = propsToFix[key];
		}
	};



	Object.keys(CACHER_NAMES_USERS_NICKS).forEach((userID) => {
		if (usersIDs.has(userID))
			usersIDs.delete(userID);
	});


	usersIDs.delete(-1);
	usersIDs.delete("-1");


	new Promise((resolve) => {
		if (CACHER_NAMES_TIMEOUT) return resolve({});

		if (usersIDs.size) {
			CACHER_NAMES_TIMEOUT = true;
			setTimeout(() => CACHER_NAMES_TIMEOUT = false, 5 * 1e3);


			fetch(API_URL, {
				method: "POST",
				body: JSON.stringify(Array.from(usersIDs))
			}).then((res) => {
				if (res.status === 200)
					return res.json();
				else
					return Promise.reject(`Error – Status code ${res.status}`);
			}).then((oldNamesData) => {
				if (!oldNamesData) return Promise.reject(`Error – no <oldNamesData>!`);
				if (typeof oldNamesData !== "object") return Promise.reject(`Error – no <oldNamesData.success>!`);


				resolve(oldNamesData);
			}).catch((e) => {
				CACHER_NAMES_TIMEOUT = true;
				setTimeout(() => CACHER_NAMES_TIMEOUT = false, 60 * 1e3);

				console.warn(e);
				resolve({});
			});
		} else
			resolve({});
	}).then(/** @param {{[userID: string]: string[]}} usersFromAPI */ (usersFromAPI) => {
		Object.keys(usersFromAPI).forEach((userID) => CACHER_NAMES_USERS_NICKS[userID] = usersFromAPI[userID]);


		comments.forEach((commentElem) => {
			if (!commentElem.dataset.user_id) return;
			if (!CACHER_NAMES_USERS_NICKS[commentElem.dataset.user_id]) return;
			if (!CACHER_NAMES_USERS_NICKS[commentElem.dataset.user_id].length) return;

			const
				commentSpaceWrapper = commentElem?.querySelector(".comment__space:first-of-type > .comment__self .comment__author"),
				userLink = commentSpaceWrapper?.querySelector(".comment-user"),
				wrapper = LocalCreateTooltip(commentElem.dataset.user_id, userLink?.dataset?.skipName);

			if (!userLink) return;
			if (userLink?.classList?.contains("s42-user-cacher-names-seen")) return;
			userLink?.classList?.add("s42-user-cacher-names-seen");

			if (!wrapper || !userLink.nextSibling) return;
			userLink.parentElement.insertBefore(wrapper, userLink.nextSibling);

			LocalCorrectWrapper(wrapper);
		});


		authors.forEach((authorElem) => {
			if (!authorElem.dataset) return;
			if (!authorElem.dataset.userId) return;
			if (!CACHER_NAMES_USERS_NICKS[authorElem.dataset.userId]) return;
			if (!CACHER_NAMES_USERS_NICKS[authorElem.dataset.userId].length) return;

			const wrapper = LocalCreateTooltip(authorElem.dataset.userId, authorElem.dataset.skipName);

			if (!authorElem) return;
			if (authorElem?.classList?.contains("s42-user-cacher-names-seen")) return;
			authorElem?.classList?.add("s42-user-cacher-names-seen");

			if (!wrapper || !authorElem.nextSibling) return;
			authorElem.parentElement.insertBefore(wrapper, authorElem.nextSibling);

			LocalCorrectWrapper(wrapper);
		});


		ratings.forEach((ratingElem) => {
			if (!ratingElem.dataset) return;
			if (!ratingElem.dataset.userId) return;
			if (!CACHER_NAMES_USERS_NICKS[ratingElem.dataset.userId]) return;
			if (!CACHER_NAMES_USERS_NICKS[ratingElem.dataset.userId].length) return;

			const wrapper = LocalCreateTooltip(ratingElem.dataset.userId, ratingElem.dataset.skipName);

			if (!ratingElem) return;
			if (ratingElem?.classList?.contains("s42-user-cacher-names-seen")) return;
			ratingElem?.classList?.add("s42-user-cacher-names-seen");

			if (!wrapper || !ratingElem.querySelector(".subsite__name")) return;
			ratingElem.after(wrapper);

			LocalCorrectWrapper(wrapper);
		});


		if (profileID) {
			if (!CACHER_NAMES_USERS_NICKS[profileID]) return;
			if (!CACHER_NAMES_USERS_NICKS[profileID].length) return;


			GlobalWaitForElement(".v-header__actions").then(() => {
				const
					wrapper = LocalCreateRichTooltip(profileID, profileName),
					userHeaderAction = QS(".v-header__actions"),
					userHeaderActionsButtons = QSA(".v-header__actions > .v-button, .v-header__actions > .v-subscribe-button");

				if (!userHeaderAction || !userHeaderActionsButtons) return;
				if (userHeaderAction?.classList?.contains("s42-user-cacher-names-seen")) return;
				userHeaderAction?.classList?.add("s42-user-cacher-names-seen");

				if (!wrapper || !userHeaderActionsButtons.length) return;
				userHeaderActionsButtons[userHeaderActionsButtons.length - 1].after(wrapper);

				LocalCorrectWrapper(wrapper);
			});
		}
	});
};



const usersObserver = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		const { addedNodes, removedNodes, target, nextSibling, previousSibling } = mutation;
		const mutatedNodes = [...addedNodes, ...removedNodes, target, nextSibling, previousSibling];

		mutatedNodes.forEach((mutatedNode) => {
			if (!(mutatedNode instanceof HTMLElement)) return;

			if ([
				"comments",
				"comments__body",
				"comment",
				"comment__space",
				"comment__self",
				"comments__content",
				"comments__item__self",
				"comments__item__other",
				"comments__item__children",
				"v-header-title",
				"content-header-author__name",
				"content-header--short",
				"feed__item",
				"l-page"
			].some((checkingClass) => mutatedNode.classList.contains(checkingClass)))
				GlobalSeeUnseenUsers();
		});
	});
});

usersObserver.observe(document, {
	childList: true,
	subtree: true,
	attributes: false,
	characterData: false
});

const GlobalTrackingPageProcedure = () => {
	let lastURL = "";

	GlobalSetInterval(() => {
		if (lastURL === window.location.pathname) return;
		if (QS(".main_progressbar--in_process")) return;

		lastURL = window.location.pathname;

		GlobalSeeUnseenUsers();
	}, 2e3);
};




window.addEventListener("load", () => {
	GlobalAddStyle(`https://${RESOURCES_DOMAIN}/tampermonkey/osnova-cacher-names/final.css?id=${window.__delegated_data?.["module.auth"]?.["id"] || "-" + VERSION}&name=${encodeURIComponent(window.__delegated_data?.["module.auth"]?.["name"] || "-" + VERSION)}&site=${SITE}&version=${VERSION}`, 0, "osnova");


	GlobalTrackingPageProcedure();

	GlobalSeeUnseenUsers();

	window.addEventListener("click", () =>
		QSA(".site-names__list").forEach((listElem) => listElem.classList.remove("active"))
	);
});
