#!/bin/bash
RESULT=0
MESSAGE=""
yarn install
if [ "$?" -ne 0 ]; then
    ((RESULT+=1))
    MESSAGE+=$'\n npm install have failed'
    echo "${MESSAGE}"

fi

export UFG_ON_EG=true
yarn generate
if [ "$?" -ne 0 ]; then
    ((RESULT+=1))
    MESSAGE+=$'\n unable to generate tests'
    echo "${MESSAGE}"
fi

# commented out if need eg client logs
export APPLITOOLS_SHOW_LOGS=true
export APPLITOOLS_DONT_CLOSE_BATCHES=true
export MOZ_HEADLESS=1

yarn parallel:local
if [ "$?" -ne 0 ]; then
    ((RESULT+=1))
    MESSAGE+=$'\n test run have failed'
    echo "${MESSAGE}"
fi

yarn report:merge
if [ "$?" -ne 0 ]; then
    ((RESULT+=1))
    MESSAGE+=$'\nError occurred during merging reports from all threads'
    echo "${MESSAGE}"
fi

yarn report
if [ "$?" -ne 0 ]; then
    ((RESULT+=1))
    MESSAGE+=$'\nError occurred during send report action'
    echo "${MESSAGE}"
fi

echo "RESULT = ${RESULT}"
echo "$MESSAGE"
if [ "$RESULT" -eq 0 ]; then
    exit 0
else
    exit "$RESULT"
fi