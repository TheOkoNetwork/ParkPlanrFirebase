#!/bin/bash

newVersion="$GITHUB_REF $GITHUB_SHA"
echo $newVersion
sed -i 's/{{APP_VERSION_HERE}}/'"$newVersion"'/g' hosting/POM/js/src/config.js