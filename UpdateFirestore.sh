#!/bin/bash
existingJSONIndexes="$(cat firestore.indexes.json)"
indexes="$(firebase firestore:indexes --token ${FIREBASE_TOOLS_TOKEN})"
exitCode=$?
if [ $exitCode -ne 0 ];then
	exit $exitCode
fi

if [ "$existingJSONIndexes" == "$indexes" ];then
	echo "local version of firestore indexes is up to date"
else
	echo "local version of firestore indexes is out of date, updating"
	echo "$indexes" > firestore.indexes.json
	echo "Commiting to git"

	git config --global user.email "circleci@mg.okonetwork.org.uk"
	git config --global user.name "Circle CI"
	git add firestore.indexes.json
	git commit -m "Updated firestore indexes from firestore service"
	git push
	exit 1
fi
