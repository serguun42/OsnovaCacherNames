const path = require("path");


module.exports = {
	entry: path.join(__dirname, "osnova-cacher-names.dev.js"),
	filename: "osnova-cacher-names.js",
	path: __dirname,
	headers: {
		"name":         "Osnova Cacher Names",
		"version":      "3.2.8-R (2021-12-09)",
		"author":       "serguun42, qq",
		"icon":         "https://serguun42.ru/resources/osnova_icons/tj.site.logo_256x256.png",
		"icon64":       "https://serguun42.ru/resources/osnova_icons/tj.site.logo_64x64.png",
		"match":        ["https://tjournal.ru/*", "https://dtf.ru/*"],
		"updateURL":    "https://serguun42.ru/tampermonkey/osnova-cacher-names/osnova-cacher-names.js",
		"downloadURL":  "https://serguun42.ru/tampermonkey/osnova-cacher-names/osnova-cacher-names.js",
		"run-at":       "document-end",
		"grant":        "none",
		"namespace":    "https://names-cacher.serguun42.ru/",
		"license":      "https://creativecommons.org/licenses/by-nc/4.0/legalcode",
		"description":  "Previous user's names from TJ Cache by qq (Rebuild by serguun42)",
		"homepage":     "https://tjournal.ru/tag/osnovanamescacher",
		"supportURL":   "https://tjournal.ru/m/99944"
	}
}
