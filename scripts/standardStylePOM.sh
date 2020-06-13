#!/bin/bash

echo "Style checking POM"
cd hosting/POM/js

echo "Prettier"
find ./src|grep "\.js"| xargs -r -E '' -t prettier --write

echo "Standard JS"
find ./src|grep "\.js"| xargs -r -E '' -t standard --fix
