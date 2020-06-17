#!/bin/bash

echo "building POM"
cd hosting/POM/js
npm install --dev
echo "building POM sign in"
npx webpack --config signinApp.webpack.config.js
echo "building POM app"
npx webpack --config app.webpack.config.js

