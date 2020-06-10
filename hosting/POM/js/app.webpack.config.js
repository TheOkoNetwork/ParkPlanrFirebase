const path = require('path')

module.exports = {
  entry: './src/app.js',
  devtool: 'source-map',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist')
  }
}
