#!/usr/bin/env bash

python -m pip install bump2version

pushd "$(dirname "${0}")"/.. > /dev/null || exit
basedir=$(pwd -L)
echo "$basedir"


cd "$basedir"/eyes_selenium || exit
bumpversion post --list --config-file "$(pwd)/.bumptest.cfg"
echo "eyes_selenium is done"
cd "$basedir"/core_universal || exit
bumpversion post --list
