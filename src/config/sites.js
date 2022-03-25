const VERSION = "3.4.2";
const RESOURCES_ROOT = (
	process.env.NODE_ENV === "development" ?
		"https://localhost/tampermonkey/osnova-cacher-names/resources/" // whatever
	:
		"https://serguun42.ru/tampermonkey/osnova-cacher-names/"
);
const SITE = window.location.hostname.match(/(?:^|\.)([^\.]+)\.(?:[^\.]+)$/i)?.[1] || "tjournal";
const NAMES_CACHER_API_URL = `https://names-cacher.serguun42.ru/${SITE}`

module.exports = {
	VERSION,
	RESOURCES_ROOT,
	SITE,
	NAMES_CACHER_API_URL
}
