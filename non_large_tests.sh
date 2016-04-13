#!/usr/bin/env bash

./node_modules/.bin/mocha --recursive --grep "@large" --invert
