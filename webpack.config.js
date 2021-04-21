const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    jquery: 'jQuery'
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer:{
    host: '0.0.0.0',
    port:9000,
    watchOptions: {
      poll: true,
    },
  },
  plugins: [new HtmlWebpackPlugin({
    title: 'Sample page',
      // Load a custom template (lodash by default)
    template: './src/index.html'
  }),
  new MiniCssExtractPlugin({
    linkType: 'text/css',
  })],
  target: ['es5']
};