#!/bin/bash

echo "building site"
cd hosting/site/js
npm install --also=dev
echo "building site app"
npx webpack --config app.webpack.config.js

