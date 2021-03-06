#!/bin/bash
existingJSONIndexes="$(cat firestore.indexes.json)"
indexes="$(firebase firestore:indexes --token ${FIREBASE_TOOLS_TOKEN})"
exitCode=$?
if [ $exitCode -ne 0 ];then
	echo "Failed to fetch indexes from firestore"
	exit $exitCode
fi

if [ "$existingJSONIndexes" == "$indexes" ];then
	echo "local version of firestore indexes is up to date"
else
	echo "local version of firestore indexes is out of date, run ./scripts/UpdateFirestore.sh"
	exit 1
fi
