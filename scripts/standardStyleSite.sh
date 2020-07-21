#!/bin/bash

echo "Style checking site"
cd hosting/site/js

echo "Prettier"
find ./src|grep "\.js"| xargs -r -E '' -t prettier --write

echo "Standard JS"
find ./src|grep "\.js"| xargs -r -E '' -t standard --fix
