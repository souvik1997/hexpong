#!/usr/bin/env bash

# Updates submodules and builds hexpong. Run from root of project directory

git submodule update

# Build jquery. Requires grunt

cd jquery
npm install
grunt --force

exit