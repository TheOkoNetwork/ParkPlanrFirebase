#!/bin/bash

echo "standardjs style checking POM"
cd hosting/POM/js
find ./src|grep "\.js"| xargs -r -E '' -t standard --fix
