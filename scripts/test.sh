#!/usr/bin/env bash

set -e # Abort on error
set -u # Abort on uninitialized variable usage

PROJECT_ROOT=$(git rev-parse --show-toplevel)

sleep 10 # Wait for servers to start up

fuser 8080/tcp || (echo "Maps application is maybe not running!")
fuser 8082/tcp || (echo "Gallery application is maybe not running!")
fuser 4444/tcp || (echo "Selenium server is maybe not running!")


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
#kill $GALLERY_PID
#kill $MAPS_PID
#kill $SELENIUM_PID
${PROJECT_ROOT}/scripts/kill_applications.sh

exit $SUCCESS
