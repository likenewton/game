var htmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');


var path = require('path');
var fs = require('fs');
var webpack = require('webpack');
var autoprefixer = require('autoprefixer');

var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;


// 获取入口(entry)对象
function getEntries(viewPath) {
  var dirs = fs.readdirSync(viewPath);
  var entryMap = {};

  dirs.forEach(function(dir) {
    // 忽略 viewPath 目录下的直接子文件，只算直接子文件夹
    if (dir.indexOf('.') === -1) {
      entryMap[dir] = [
        path.resolve(viewPath, dir + '/index')
      ];
    }
  });

  return entryMap;
}

// 获取plugin数组
function getPlugins(viewPath) {
  let dirs = fs.readdirSync(viewPath);
  let pluginMap = [];

  // htmlWebpackPlugin
  dirs.forEach((dir) => {
    // 忽略 viewPath 目录下的直接子文件，只算直接子文件夹
    if (!dir.includes('.')) {
      pluginMap = [...pluginMap, new htmlWebpackPlugin({
        inject: 'body',
        template: `views/${dir}.html`,
        filename: `${dir}.html`,
        chunks: [`${dir}`, 'common', 'manifest'],
      })]
    }
  });

  // commonChunckPlugin
  pluginMap = [...pluginMap, new webpack.optimize.CommonsChunkPlugin({
    names: ['common', 'manifest'],
    minChunks: 2,
  })]

  pluginMap = [...pluginMap, new ExtractTextPlugin('style/[name].[hash].css')]

  return pluginMap;
}


module.exports = {
  //devtool: 'eval-source-map',
  devtool: 'source-map',

  entry: getEntries('./app/pages'),
  output: {
    path: __dirname + "/build",
    filename: 'js/[name].[hash].js',
    publicPath: '/',
  },

  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
      query: {
        presets: ['latest']
      }
    }, {
      test: /\.tpl$/,
      loader: 'html?-attrs'
    }, {
      test: /\.html$/,
      loader: 'html-loader'
    }, {
      test: /\.scss$/,
      loader: 'style!css!postcss!sass',
      loader: ExtractTextPlugin.extract('style', 'css!postcss!sass')
    }, {
      test: /\.(png|jpg|gif)(\?.*)?(#.*)?$/,
      loader: 'url?name=images/[name].[ext]&limit=800' //生产模式<8kb转化base64
    }, {
      test: /\.(eot|ttf|woff|svg)(\?.*)?(#.*)?$/,
      loader: 'url?name=fonts/[name].[ext]'
    }, ]
  },

  devServer: {
    contentBase: "./build", //本地服务器所加载的页面所在的目录
    historyApiFallback: true, //不跳转
    inline: true, //实时刷新
    port: 8810,
    outputPath: path.resolve(__dirname)
  },

  plugins: getPlugins('./app/pages'),

}