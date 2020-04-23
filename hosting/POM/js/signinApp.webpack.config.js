const path = require('path')

module.exports = {
  entry: './src/signinApp.js',
  output: {
    filename: 'signinApp.js',
    path: path.resolve(__dirname, 'dist')
  }
}
