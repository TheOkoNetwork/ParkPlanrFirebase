#!/bin/bash

echo "building POM"
cd hosting/POM/js
npm install --dev
npx webpack --config signinApp.webpack.config.js
npx webpack --config app.webpack.config.js

