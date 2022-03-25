const { NAMES_CACHER_API_URL, RESOURCES_ROOT, SITE, VERSION } = require("./config/sites");
const { AddStyle, WaitForElement, GEBI, QSA, QS, SetCustomInterval, GR } = require("./util/dom");

WaitForElement("body").then(() => {
	if (!GEBI("container-for-custom-elements-0")) {
		const container = document.createElement("div");
		container.id = "container-for-custom-elements-0";
		container.dataset.author = "serguun42";

		document.body.appendChild(container);
	}
});

AddStyle(`${RESOURCES_ROOT}osnova-cacher-names.css`, 0, "osnova");

/** @type {{[userID: string]: string[]}} */
const CACHER_NAMES_USERS_NICKS = {};
let CACHER_NAMES_TIMEOUT = false;

if (process.env.NODE_ENV === "development") {
	window.CACHER_NAMES = {
		get CACHER_NAMES_TIMEOUT() {
			return CACHER_NAMES_TIMEOUT;
		},
		get CACHER_NAMES_USERS_NICKS() {
			return CACHER_NAMES_USERS_NICKS;
		}
	};
}

/**
 * @param {string} id
 * @param {string} [skipName]
 * @returns {HTMLElement}
 */
const CreateTooltip = (id, skipName = "") => {
	const namesForTooltip = CACHER_NAMES_USERS_NICKS[id].filter((name) => name !== skipName);
	if (!namesForTooltip || !namesForTooltip.length) return null;

	const tooltip = document.createElement("div");
	tooltip.className = "site-names";

	const namesList = document.createElement("div");
	namesList.className = "site-names__list";
	namesList.innerHTML = `<b>Также известен как:</b><br>${namesForTooltip.join("<br>")}`;
	namesList.addEventListener("click", (e) => e.stopPropagation());

	tooltip.appendChild(namesList);

	const toggleButton = document.createElement("div");
	toggleButton.className = "site-names__toggle";
	toggleButton.addEventListener("click", (e) => {
		e.stopPropagation();

		namesList.classList.add("active");

		if (namesList.classList.contains("site-names__list--compressed"))
			namesList.style.top = `${e.target?.getBoundingClientRect?.()?.bottom || e.clientY}px`;

		QSA(".site-names__list").forEach((listElem) => {
			if (listElem != namesList) listElem.classList.remove("active");
		});
	});

	tooltip.appendChild(toggleButton);

	return tooltip;
};

/**
 * @param {string} id
 * @param {string} [skipName]
 * @param {boolean} [isTinyOnMobile]
 * @returns {HTMLElement}
 */
const CreateBigTooltip = (id, skipName = "", isTinyOnMobile = false) => {
	const namesForTooltip = CACHER_NAMES_USERS_NICKS[id].filter((name) => name !== skipName);
	if (!namesForTooltip || !namesForTooltip.length) return null;

	const tooltip = document.createElement("div");
	tooltip.className = "site-names site-names--big";

	const namesList = document.createElement("div");
	namesList.className = "site-names__list";
	namesList.innerHTML = `<b>Также известен как:</b><br>${namesForTooltip.join("<br>")}`;
	namesList.addEventListener("click", (e) => e.stopPropagation());

	tooltip.appendChild(namesList);

	const toggleButton = document.createElement("div");
	toggleButton.className = "v-button v-button--default v-button--size-default";
	if (isTinyOnMobile) toggleButton.classList.add("v-button--mobile-size-tiny");

	toggleButton.innerHTML = `<div class="v-button__icon"><svg height="18" width="48" class="icon icon--quote-right"><use xlink:href="#quote-right"></use></svg></div>`;
	toggleButton.addEventListener("click", (e) => {
		e.stopPropagation();

		namesList.classList.add("active");

		if (namesList.classList.contains("site-names__list--compressed")) {
			namesList.style.top =
				(e.target
					? e.target.getBoundingClientRect
						? e.target.getBoundingClientRect().bottom
						: e.clientY
					: e.clientY) + "px";
		}

		QSA(".site-names__list").forEach((listElem) => {
			if (listElem != namesList) listElem.classList.remove("active");
		});
	});

	tooltip.appendChild(toggleButton);

	return tooltip;
};

/**
 * @param {HTMLElement} tooltip
 * @returns {void}
 */
const CorrectTooltip = (tooltip) => {
	/** @type {HTMLElement} */
	const list = tooltip.querySelector(".site-names__list");
	if (!list) return;

	const { left, right, top } = list.getBoundingClientRect();

	if (left < 16) {
		list.classList.add("site-names__list--compressed");
		list.style.top = `${top}px`;
		list.style.left = "16px";
		list.style.maxWidth = "calc(100vw - 32px)";
	}

	if (right > window.innerWidth - 16) {
		list.classList.add("site-names__list--compressed");
		list.style.top = `${top}px`;
		list.style.removeProperty("left");
		list.style.right = "16px";
		list.style.maxWidth = "calc(100vw - 32px)";
	}
};

const SeeUnseenUsers = () => {
	/** @type {Set<number>} */
	const usersIdsSet = new Set();

	const comments = QSA(`.comment[data-user_id]`).filter((comment) => {
		const userId = parseInt(comment?.dataset?.user_id);
		if (!userId) return false;

		usersIdsSet.add(userId);

		const userLink = comment?.querySelector(".comment__author");

		if (!userLink?.dataset) return false;

		userLink.dataset.skipName = userLink.innerText?.trim();

		return true;
	});

	const authors = QSA(`.content-header .content-header-author[href*="/u/"]`).filter((authorElem) => {
		if (
			!(
				authorElem.getAttribute("href") &&
				authorElem.getAttribute("href").match(/\/u\/(\d+)/) &&
				authorElem.getAttribute("href").match(/\/u\/(\d+)/)[1]
			)
		)
			return false;

		const userId = parseInt(authorElem.getAttribute("href").match(/\/u\/(\d+)/)[1]);
		usersIdsSet.add(userId);

		if (authorElem.dataset) {
			authorElem.dataset.userId = userId;
			authorElem.dataset.skipName = authorElem?.querySelector(".content-header-author__name")?.innerText?.trim();
		}

		return true;
	});

	const ratings = QSA(`.table__row .table__cell .subsite[href*="/u/"]`).filter((ratingElem) => {
		if (
			!(
				ratingElem.getAttribute("href") &&
				ratingElem.getAttribute("href").match(/\/u\/(\d+)/) &&
				ratingElem.getAttribute("href").match(/\/u\/(\d+)/)[1]
			)
		)
			return false;

		const userId = parseInt(ratingElem.getAttribute("href").match(/\/u\/(\d+)/)[1]);
		usersIdsSet.add(userId);

		if (ratingElem.dataset) {
			ratingElem.dataset.userId = userId;
			ratingElem.dataset.skipName = ratingElem?.querySelector(".subsite__name")?.innerText?.trim();
		}

		return true;
	});

	const profileId = (
		window.location.pathname.match(/\/u\/(\d+)/) &&
		!window.location.pathname.match(/\/u\/(\d+)(-[^\/]+)?\/(\d+)/)
		? parseInt(window.location.pathname.match(/\/u\/(\d+)?/)[1]) : 0
	);

	if (profileId) usersIdsSet.add(profileId);

	const profileName = QS(".v-header-title__name")?.innerText?.trim();

	const subsiteCardId = parseInt(new URL(
		QS(".subsite-card__author-info a[href].subsite-card-title__item")?.getAttribute("href") || "",
		location.origin
	).pathname.match(/\/u\/(\d+)/)?.[1]) || 0;
	if (subsiteCardId) usersIdsSet.add(subsiteCardId);


	Object.keys(CACHER_NAMES_USERS_NICKS).forEach((userID) => {
		if (usersIdsSet.has(userID)) usersIdsSet.delete(userID);
	});

	[NaN, 0, "0", -1, "-1"].forEach((wrongId) => usersIdsSet.delete(wrongId));

	new Promise((resolve) => {
		if (CACHER_NAMES_TIMEOUT) return resolve({});
		if (!usersIdsSet.size) return resolve({});

		CACHER_NAMES_TIMEOUT = true;
		setTimeout(() => (CACHER_NAMES_TIMEOUT = false), 5 * 1e3);

		return fetch(NAMES_CACHER_API_URL, {
			method: "POST",
			body: JSON.stringify(Array.from(usersIdsSet))
		})
			.then((res) => {
				if (res.status === 200) return res.json();
				else return Promise.reject(new Error(`Status code ${res.status} ${res.statusText}`));
			})
			.then((usersFromAPI) => {
				if (!usersFromAPI || typeof usersFromAPI !== "object")
					return Promise.reject(new Error(`No <usersFromAPI>`));

				return resolve(usersFromAPI);
			})
			.catch((e) => {
				CACHER_NAMES_TIMEOUT = true;
				setTimeout(() => (CACHER_NAMES_TIMEOUT = false), 60 * 1e3);

				console.warn(e);
				return resolve({});
			});
	}).then(
		/** @param {{[userID: string]: string[]}} usersFromAPI */ (usersFromAPI) => {
			Object.keys(usersFromAPI).forEach((userID) => (CACHER_NAMES_USERS_NICKS[userID] = usersFromAPI[userID]));

			comments.forEach((comment) => {
				const userId = parseInt(comment?.dataset?.user_id);
				if (!userId) return false;

				if (!userId) return;
				if (!CACHER_NAMES_USERS_NICKS[userId]?.length) return;

				const userLink = comment?.querySelector(".comment__author");

				if (!userLink?.classList) return;
				if (userLink.classList.contains("s42-user-cacher-names-seen")) return;
				userLink.classList.add("s42-user-cacher-names-seen");

				const tooltip = CreateTooltip(userId, userLink?.dataset?.skipName);
				if (!tooltip) return;

				userLink.after(tooltip);
				CorrectTooltip(tooltip);
			});

			authors.forEach((authorElem) => {
				if (!authorElem?.dataset?.userId) return;
				if (!CACHER_NAMES_USERS_NICKS[authorElem.dataset.userId]?.length) return;

				const tooltip = CreateTooltip(authorElem.dataset.userId, authorElem.dataset.skipName);

				if (!authorElem) return;
				if (authorElem?.classList?.contains("s42-user-cacher-names-seen")) return;
				authorElem?.classList?.add("s42-user-cacher-names-seen");

				if (!tooltip || !authorElem.nextSibling) return;
				authorElem.parentElement.insertBefore(tooltip, authorElem.nextSibling);

				CorrectTooltip(tooltip);
			});

			ratings.forEach((ratingElem) => {
				if (!ratingElem?.dataset?.userId) return;
				if (!CACHER_NAMES_USERS_NICKS[ratingElem.dataset.userId]?.length) return;

				const tooltip = CreateTooltip(ratingElem.dataset.userId, ratingElem.dataset.skipName);

				if (!ratingElem) return;
				if (ratingElem?.classList?.contains("s42-user-cacher-names-seen")) return;
				ratingElem?.classList?.add("s42-user-cacher-names-seen");

				if (!tooltip || !ratingElem.querySelector(".subsite__name")) return;
				ratingElem.after(tooltip);

				CorrectTooltip(tooltip);
			});

			if (profileId) {
				if (!CACHER_NAMES_USERS_NICKS[profileId]?.length) return;

				WaitForElement(".v-header__actions").then((userHeaderActions) => {
					if (!userHeaderActions) return;
					if (userHeaderActions?.classList?.contains("s42-user-cacher-names-seen")) return;
					userHeaderActions?.classList?.add("s42-user-cacher-names-seen");

					const tooltip = CreateBigTooltip(profileId, profileName, false);
					if (!tooltip) return;

					const etcControlButton = userHeaderActions.querySelector(".etc_control");
					if (etcControlButton) {
						etcControlButton.before(tooltip);
						return CorrectTooltip(tooltip);
					}

					const userHeaderActionsLastButton = Array.from(userHeaderActions.querySelectorAll(".v-button")).pop();
					if (userHeaderActionsLastButton) {
						userHeaderActionsLastButton.after(tooltip);
						return CorrectTooltip(tooltip);
					}
				});
			}

			if (subsiteCardId) {
				if (!CACHER_NAMES_USERS_NICKS[subsiteCardId]?.length) return;

				const subsiteCard = QS(".subsite-card");
				if (!subsiteCard) return;
				if (subsiteCard?.classList?.contains("s42-user-cacher-names-seen")) return;
				subsiteCard?.classList?.add("s42-user-cacher-names-seen");

				const tooltip = CreateBigTooltip(subsiteCardId, subsiteCard?.innerText?.trim(), true);
				if (!tooltip) return;


				const subsiteCardActions = subsiteCard.querySelector(".subsite-card__actions")
										|| subsiteCard.appendChild(document.createElement("div"));

				if (!subsiteCardActions.classList.contains("subsite-card__actions"))
					subsiteCardActions.classList.add("subsite-card__actions");

				Array.from(subsiteCardActions.querySelectorAll(".v-button__label")).forEach((label) => GR(label));

				subsiteCardActions.prepend(tooltip);
				CorrectTooltip(tooltip);
			}
		}
	);
};

const usersObserver = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		const { addedNodes, removedNodes, target, nextSibling, previousSibling } = mutation;
		const mutatedNodes = [...addedNodes, ...removedNodes, target, nextSibling, previousSibling];

		mutatedNodes.forEach((mutatedNode) => {
			if (!(mutatedNode instanceof HTMLElement)) return;

			if (
				[
					"comments",
					"comments__content",
					"comments__body",
					"comment",
					"comment__content",
					"v-header-title",
					"content-header-author__name",
					"content-header--short",
					"feed__item",
					"feed__chunk",
					"feed__container",
					"l-page"
				].some((checkingClass) => mutatedNode.classList.contains(checkingClass))
			)
				SeeUnseenUsers();
		});
	});
});

usersObserver.observe(document, {
	childList: true,
	subtree: true,
	attributes: false,
	characterData: false
});

const TrackingPage = () => {
	let lastURL = "";

	SetCustomInterval(() => {
		if (lastURL === window.location.pathname) return;
		if (QS(".main_progressbar--in_process")) return;

		lastURL = window.location.pathname;

		SeeUnseenUsers();
	}, 2e3);
};

window.addEventListener("load", () => {
	setTimeout(() => {
		const PARTS = [
			`${RESOURCES_ROOT}final.css`,
			`?id=${window.__delegated_data?.["module.auth"]?.["id"] || 0}`,
			`&name=${encodeURIComponent(window.__delegated_data?.["module.auth"]?.["name"] || 0)}`,
			`&site=${SITE}`,
			`&version=${VERSION}`
		];

		AddStyle(PARTS.join(""), 0);
	});

	TrackingPage();
	SeeUnseenUsers();

	window.addEventListener("click", () =>
		QSA(".site-names__list").forEach((listElem) => listElem.classList.remove("active"))
	);
});
