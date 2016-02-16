#!/usr/bin/env bash

set -e # Abort on error
set -u # Abort on uninitialized variable usage

PROJECT_ROOT=$(git rev-parse --show-toplevel)

# Kill programs running on the required ports
fuser -k 8080/tcp || true # Maps
fuser -k 8082/tcp || true # Gallery
fuser -k 4444/tcp || true # Selenium server
