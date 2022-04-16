# Osnova Cacher Names
Userscript bringing users' previous names to Osnova platform.

## How it works
Core file [`src/core.js`](./src/core.js) imports necessary utils and modules. Webpack bundles all JS files in [`src`](./src) to single `build/osnova-cacher-names.user.js` – this bundled file is ready for use in _*monkey_.

All [CSS and other resources](./resources) could be deployed to production server without any minification. For minification see `npm run resources` command.

## Building with npm
1. Install necessary dependencies – `npm i --production`
2. Bundle userscript with [webpack](https://webpack.js.org/) and [serguun42-webpack-userscript](https://github.com/serguun42/serguun42-webpack-userscript) plugin – `npm run build`
3. Minify all css with [postcss](https://github.com/postcss/postcss), [cssnano](https://cssnano.co/) and [autoprefixer](https://github.com/postcss/autoprefixer) and dump it to `build/` folder – `npm run resources`

## Development
1. Install all dependencies – `npm i`
2. Build userscript in [watch mode](https://webpack.js.org/configuration/watch/) – `npm run dev`

## Info
* Changelog posts on [TJournal](https://tjournal.ru/tag/osnovanamescacher)
* Changelog posts on [DTF](https://dtf.ru/tag/osnovanamescacher)

#### [License – GNU GPL v3](./LICENSE)
