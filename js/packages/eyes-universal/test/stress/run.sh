#!/bin/bash

trap "exit" INT TERM    # Convert INT and TERM to EXIT
trap "kill 0" EXIT      # Kill all children if we receive EXIT

function run-stress-test {
    npx ts-node ./test/stress/index.ts
}

pids=''

# Run stuff in the background
while read i
do 
    run-stress-test &
    pids[${i}]=$!

done <<< "$(seq $1)"


# wait for all pids
for pid in ${pids[*]}; do
    wait $pid
done

echo "stress test done"
