// const functions = require('firebase-functions');
// const admin = require('firebase-admin')
const glob = require('glob')
const camelcase = require('camelcase')
// const querystring = require('querystring')
var DataFile = 12
console.log(DataFile)

// try {
//  admin.initializeApp()
// } catch (e) {
//  // yes this is meant to be empty
// }
// var gravatar = require('gravatar')

const files = glob.sync('./src/**/*.f.js', { cwd: __dirname })
for (let f = 0, fl = files.length; f < fl; f++) {
  const file = files[f]
  var path
  path = file.slice(0, -5).split('/')
  path.shift()
  path.shift()
  const CamelCaseFunctionName = camelcase(path)
  const functionName = CamelCaseFunctionName[0].toUpperCase() + CamelCaseFunctionName.slice(1)

  if (
    !process.env.FUNCTION_NAME ||
    process.env.FUNCTION_NAME === functionName
  ) {
    exports[functionName] = require(file)
  }
}
