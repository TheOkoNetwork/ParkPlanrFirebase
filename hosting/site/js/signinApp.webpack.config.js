const path = require('path')

module.exports = {
  entry: './src/signinApp.js',
  devtool: 'source-map',
  output: {
    filename: 'signinApp.js',
    path: path.resolve(__dirname, 'dist')
  }
}
