const { resolve } = require('path');
const { DefinePlugin } = require('webpack');
const WebpackUserscriptPlugin = require('@serguun42/webpack-userscript-plugin');

const PRODUCTION = process.argv[process.argv.indexOf('--env') + 1] !== 'development';
const USERSCRIPT_HEADERS = require('./src/config/userscript.json');

if (!PRODUCTION) {
  USERSCRIPT_HEADERS.name += ' (DEV)';
  delete USERSCRIPT_HEADERS.downloadURL;
  delete USERSCRIPT_HEADERS.updateURL;
}

/** @type {import("webpack").Configuration} */
module.exports = {
  entry: resolve('src', 'core.js'),
  output: {
    filename: 'osnova-cacher-names.user.js',
    path: resolve('build'),
  },
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(PRODUCTION ? 'production' : 'development'),
    }),
    new WebpackUserscriptPlugin({
      headers: USERSCRIPT_HEADERS,
      metajs: true,
    }),
  ],
  module: {
    rules: [
      PRODUCTION
        ? {
            test: /\.[cm]?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      targets: {
                        chrome: '58',
                      },
                    },
                  ],
                ],
              },
            },
          }
        : {},
    ],
  },
  watch: !PRODUCTION,
  mode: PRODUCTION ? 'production' : 'development',
};
