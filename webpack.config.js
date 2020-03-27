const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const ScriptExtHtmlWebpackPlugin = require("script-ext-html-webpack-plugin");
const WebappWebpackPlugin = require('favicons-webpack-plugin');

const extractSass = new ExtractTextPlugin({
    filename: "[name]-[hash].css"
});

const webRoot = function (env) {
  if (env === 'production') {
    return 'https://multisig.vec.io';
  } else {
    return 'http://multisig.local';
  }
};

const apiRoot = function (env) {
  if (env === 'production') {
    return 'https://mixin-api.zeromesh.net';
  } else {
    return 'https://mixin-api.zeromesh.net';
  }
};

const clientId = function (env) {
  if (env === 'production') {
    return '37e040ec-df91-47a7-982e-0e118932fa8b';
  } else {
    return '37e040ec-df91-47a7-982e-0e118932fa8b';
  }
};

module.exports = {
  entry: {
    app: './src/app.js'
  },

  output: {
    publicPath: '/assets/',
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]-[chunkHash].js'
  },

  resolve: {
    alias: {
      jquery: "jquery/dist/jquery",
      handlebars: "handlebars/dist/handlebars.runtime"
    }
  },

  module: {
    rules: [{
      test: /\.html$/, loader: "handlebars-loader?helperDirs[]=" + __dirname + "/src/helpers"
    }, {
      test: /\.(scss|css)$/,
      use: extractSass.extract({
        use: [{
          loader: "css-loader"
        }, {
          loader: "sass-loader"
        }],
        fallback: "style-loader"
      })
    }, {
      test: /\.(woff|woff2|eot|ttf|otf|svg)$/i,
      loader: 'file-loader',
      options: {
        name(file) {
          if (process.env.NODE_ENV === 'development') {
            return '[path][name].[ext]';
          }
          return '[hash].[ext]';
        },
        emitFile: true
      },
    }, {
      test: /\.(png|svg|jpe?g|gif)$/i,
      loader: 'file-loader',
      options: {
        name(file) {
          if (process.env.NODE_ENV === 'development') {
            return '[path][name].[ext]';
          }
          return '[hash].[ext]';
        },
        emitFile: true
      },
    }]
  },

  plugins: [
    new webpack.DefinePlugin({
      PRODUCTION: (process.env.NODE_ENV === 'production'),
      WEB_ROOT: JSON.stringify(webRoot(process.env.NODE_ENV)),
      API_ROOT: JSON.stringify(apiRoot(process.env.NODE_ENV)),
      CLIENT_ID: JSON.stringify(clientId(process.env.NODE_ENV)),
      APP_NAME: JSON.stringify('Multisig Wallet')
    }),
    new HtmlWebpackPlugin({
      template: './src/layout.html'
    }),
    new WebappWebpackPlugin({
      logo: './src/launcher.png',
      prefix: 'icons-[hash]-'
    }),
    new ScriptExtHtmlWebpackPlugin({
      defaultAttribute: 'async'
    }),
    extractSass
  ]
};
