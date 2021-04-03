#!/bin/bash

branch = $(echo $GITHUB_REF|awk -F'/' '{print $3}')
newVersion="$branch_${GITHUB_SHA::8}"
echo $newVersion
sed -i 's/{{APP_VERSION_HERE}}/'"$newVersion"'/g' hosting/POM/js/src/config.js