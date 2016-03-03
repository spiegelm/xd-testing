#!/usr/bin/env bash

set -e # Abort on error
set -u # Abort on uninitialized variable usage

PROJECT_ROOT=$(git rev-parse --show-toplevel)

# Start gallery
echo "Run gallery app"
cd ${PROJECT_ROOT}/testapp/XD-MVC/Examples/Gallery
nohup node gallery-polymer.js > gallery.log &
GALLERY_PID=$!
echo $GALLERY_PID

# Start maps
echo "Run gallery app"
cd ${PROJECT_ROOT}/testapp/XD-MVC/Examples/Maps
nohup node server.js > maps.log &
MAPS_PID=$!
echo $MAPS_PID


echo "Run basic test app"
cd ${PROJECT_ROOT}/testapp/basic/
nohup ./node_modules/.bin/http-server -p 8090 > testapp.log &



# Start selenium server
cd ${PROJECT_ROOT}
echo "Start selenium sever"
nohup ./start_selenium.sh > selenium.log 2>&1 &
SELENIUM_PID=$!
echo $SELENIUM_PID
