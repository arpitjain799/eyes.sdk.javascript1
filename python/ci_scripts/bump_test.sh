#!/usr/bin/env bash

python -m pip install bump2version

pushd "$(dirname "${0}")"/.. > /dev/null || exit
basedir=$(pwd -L)
echo "$basedir"


cd "$basedir"/eyes_selenium || exit
bumpversion build --list --dry-run --config-file "$(pwd)/.bumptest.cfg" --allow-dirty
echo "eyes_selenium is done"
cd "$basedir"/core_universal || exit
current_version="$(grep current_version setup.cfg | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+\(\.[a-zA-Z]\+\)\?')"
new_version="$current_version".test
echo "$new_version"
bumpversion post --new-version "$new_version" --list --dry-run --allow-dirty
