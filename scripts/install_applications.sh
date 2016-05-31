#!/usr/bin/env bash

set -e # Abort on error
set -u # Abort on uninitialized variable usage

PROJECT_ROOT=$(git rev-parse --show-toplevel)

# Get XD-MVC
cd ${PROJECT_ROOT}/testapp

# Remove old repository
rm -rf XD-MVC

# Clone XD-MVC repository
git clone -b master --single-branch --depth 1 https://github.com/spiegelm/XD-MVC.git XD-MVC

# Setup gallery app
echo "Setup gallery app"
cd ${PROJECT_ROOT}/testapp/XD-MVC/Examples/Gallery
npm install > install.log
./node_modules/.bin/bower install >> install.log

# Setup maps app
echo "Setup maps app"
cd ${PROJECT_ROOT}/testapp/XD-MVC/Examples/Maps
npm install > install.log
./node_modules/.bin/bower install >> install.log

echo "Setup basic test app"
cd ${PROJECT_ROOT}/testapp/basic
npm install
