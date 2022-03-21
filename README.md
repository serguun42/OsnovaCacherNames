# Osnova Cacher Names
Userscript bringing users' previous names to Osnova platform.

## How it works
Core file [`src/core.js`](./src/core.js) imports necessary utils. Webpack bundles (via task `npm run build`) all javascript files in [`src`](./src) to single `build/osnova-cacher-names.user.js` (relative to root). Then this bundled file ready for _*monkey_, all [CSS and other resources](./resources) could be deployed to production server.

## Commands
1. Install necessary dependencies – `npm i --force`
1. Build userscript with webpack config – `npm run build`

## [LICENSE – GNU GPL v3](./LICENSE)

### Info
* Updates on [TJournal](https://tjournal.ru/tag/osnovanamescacher)
* Updates on [DTF](https://dtf.ru/tag/osnovanamescacher)
