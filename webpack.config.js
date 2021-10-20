const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ScriptExtHtmlWebpackPlugin = require("script-ext-html-webpack-plugin");
const WebappWebpackPlugin = require('favicons-webpack-plugin');

const devMode = process.env.NODE_ENV !== 'production';

const apiRoot = function (env) {
  if (env === 'production') {
    return 'https://mixin-api.zeromesh.net';
  } else {
    return 'https://mixin-api.zeromesh.net';
  }
};

const clientId = function (env) {
  if (env === 'production') {
    return '037ba0df-afbf-4491-8053-62c7a3957d7b';
  } else {
    return '037ba0df-afbf-4491-8053-62c7a3957d7b';
  }
};

module.exports = {
  entry: {
    app: './src/app.js'
  },

  output: {
    publicPath: '/assets/',
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]-[hash].js'
  },

  resolve: {
    alias: {
      jquery: "jquery/dist/jquery",
      handlebars: "handlebars/dist/handlebars.runtime"
    }
  },

  module: {
    rules: [{
      test: /\.html$/,
      use: ["handlebars-loader?helperDirs[]=" + __dirname + "/src/helpers"]
    }, {
      test: /\.(scss|css)$/,
      use: [
        {
          loader: MiniCssExtractPlugin.loader,
          options: {
            esModule: true
          },
        },
        'css-loader',
        'sass-loader',
      ]
    }, {
      test: /\.(woff|woff2|eot|ttf|otf|svg|png|jpg|gif)$/,
      use: [
        'file-loader'
      ]
    }]
  },

  plugins: [
    new webpack.DefinePlugin({
      PRODUCTION: (process.env.NODE_ENV === 'production'),
      API_ROOT: JSON.stringify(apiRoot(process.env.NODE_ENV)),
      CLIENT_ID: JSON.stringify(clientId(process.env.NODE_ENV)),
      APP_NAME: JSON.stringify('Multisig Wallet')
    }),
    new HtmlWebpackPlugin({
      template: './src/layout.html'
    }),
    new WebappWebpackPlugin({
      logo: './src/launcher.png',
      prefix: 'icons/'
    }),
    new ScriptExtHtmlWebpackPlugin({
      defaultAttribute: 'async'
    }),
    new MiniCssExtractPlugin({
      filename: devMode ? '[name].css' : '[name]-[hash].css',
      chunkFilename: devMode ? '[id].css' : '[id]-[hash].css',
    }),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"]
    })
  ]
};
