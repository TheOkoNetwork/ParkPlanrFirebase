#!/bin/bash

echo "building site"
cd hosting/site/js
npm install --dev
echo "building site sign in"
npx webpack --config signinApp.webpack.config.js
echo "building site app"
npx webpack --config app.webpack.config.js

