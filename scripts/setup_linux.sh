#!/usr/bin/env bash

set -e # Abort on error
set -u # Abort on uninitialized variable usage

PROJECT_ROOT=$(git rev-parse --show-toplevel)

cd ${PROJECT_ROOT}

./scripts/kill_applications.sh
./scripts/install_applications.sh
./scripts/start_applications.sh

echo "Wait for applications to start up"
sleep 10
