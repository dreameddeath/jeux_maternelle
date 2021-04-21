const path = require('path');

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
    ],
  },
  externals: {
    jquery: 'jQuery'
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: './dist/bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer:{
    host: '0.0.0.0',
    port:9000,
    watchOptions: {
      poll: true,
    },
  }
};