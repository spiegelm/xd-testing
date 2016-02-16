#!/usr/bin/env bash

set -e # Abort on error
set -u # Abort on uninitialized variable usage

PROJECT_ROOT=$(git rev-parse --show-toplevel)

# Get XD-MVC
cd ${PROJECT_ROOT}/testapp

# Remove old repository
#if [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
#    # Windows NT platform
#    # Deleting does not work in Windows because "file names are too long to delete"
#    DIRECTORY="${PROJECT_ROOT}/testapp/XD-MVC"
#    if [ -d "$DIRECTORY" ]; then
#        echo "You are running Windows. Please delete the folder '$DIRECTORY' manually."
#        echo "Press Return to continue..."
#        read
#    fi
#else
rm -rf XD-MVC
#fi

# Clone XD-MVC repository
git clone --depth 1 https://github.com/spiegelm/XD-MVC.git XD-MVC

# Setup gallery app
echo "Setup gallery app"
cd ${PROJECT_ROOT}/testapp/XD-MVC/Examples/Gallery
npm install
./node_modules/.bin/bower install

# Setup maps app
echo "Setup maps app"
cd ${PROJECT_ROOT}/testapp/XD-MVC/Examples/Maps
npm install
./node_modules/.bin/bower install
