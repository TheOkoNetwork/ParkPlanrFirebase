#!/bin/bash

echo "standardjs style checking admin site"
cd hosting/admin/js
find ./src|grep "\.js"| xargs -r -E '' -t standard
