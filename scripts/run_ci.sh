#!/usr/bin/env bash

set -e # Abort on error
set -u # Abort on uninitialized variable usage

PROJECT_ROOT=$(git rev-parse --show-toplevel)

# Kill programs running on the required ports
fuser -k 8080/tcp || true # Maps
fuser -k 8082/tcp || true # Gallery
fuser -k 4444/tcp || true # Selenium server

# Run gallery
echo "Run gallery app"
cd ${PROJECT_ROOT}/testapp/XD-MVC/Examples/Gallery
nohup node gallery-polymer.js > gallery.log &
GALLERY_PID=$!
echo $GALLERY_PID

# Run maps
echo "Run gallery app"
cd ${PROJECT_ROOT}/testapp/XD-MVC/Examples/Maps
nohup node server.js > maps.log &
MAPS_PID=$!
echo $MAPS_PID

# Setup selenium server
cd ${PROJECT_ROOT}
echo "Start selenium sever"
nohup ./start_selenium.sh > selenium.log &
SELENIUM_PID=$!
echo $SELENIUM_PID


sleep 10 # Wait for servers to start up

fuser 8080/tcp || (echo "Maps application is not running!" && exit 1)
fuser 8082/tcp || (echo "Gallery application is not running!" && exit 1)
fuser 4444/tcp || (echo "Selenium server is not running!" && exit 1)


cat gallery.out || true
cat maps.out || true
cat selenium.out || true

echo "Generate config file"
./lib/generate-config.js

# Run the tests
echo "Run tests"
set +e
npm test
SUCCESS=$?


# Kill our stuff
kill $GALLERY_PID
kill $MAPS_PID
kill $SELENIUM_PID
fuser -k 8080/tcp || true # Maps
fuser -k 8082/tcp || true # Gallery
fuser -k 4444/tcp || true # Selenium server

exit $SUCCESS
