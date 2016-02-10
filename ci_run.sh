#!/usr/bin/env bash

set -e # Abort on error
set -u # Abort on uninitialized variable usage

PROJECT_ROOT=$(git rev-parse --show-toplevel)

# Get XD-MVC
cd ${PROJECT_ROOT}/testapp
# This does not work in Windows because "file names are too long to delete"
# rm -rf XD-MVC
git clone --depth 1 https://github.com/mhusm/XD-MVC.git XD-MVC

# Setup gallery
cd ${PROJECT_ROOT}/testapp/XD-MVC/Examples/Gallery
npm install
bower install
echo "Start gallery app"
node gallery-polymer.js >/dev/null &
GALLERY_PID=$!
echo $GALLERY_PID

# Setup maps
cd ${PROJECT_ROOT}/testapp/XD-MVC/Examples/Maps
npm install
bower install
echo "Start gallery app"
node server.js >/dev/null &
MAPS_PID=$!
echo $MAPS_PID

# Setup selenium server
cd ${PROJECT_ROOT}
echo "Start selenium sever"
./start_selenium.sh >/dev/null &
SELENIUM_PID=$!
echo $SELENIUM_PID

# Run the tests
echo "Run tests"
npm test

# Kill background processes
set +e
kill $GALLERY_PID
kill $MAPS_PID
kill $SELENIUM_PID
