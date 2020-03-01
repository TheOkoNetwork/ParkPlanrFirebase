#!/bin/bash

echo "building admin site"
cd hosting/admin/js
#npm install --dev
npx webpack --config signinApp.webpack.config.js
npx webpack --config app.webpack.config.js

