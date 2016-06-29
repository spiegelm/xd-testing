#!/usr/bin/env bash

set -e # Abort on error
set -u # Abort on uninitialized variable usage

PROJECT_ROOT=$(git rev-parse --show-toplevel)

fuser 8080/tcp || (echo "Maps application is maybe not running!")
fuser 8082/tcp || (echo "Gallery application is maybe not running!")
fuser 4444/tcp || (echo "Selenium server is maybe not running!")


cat gallery.out || true
cat maps.out || true
cat selenium.out || true

echo "Generate config file"
./lib/generate-scenarios.js --device nexus4

# Run the tests
echo "Run tests"
set +e
npm test
SUCCESS=$?

exit $SUCCESS
