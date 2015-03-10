#!/usr/bin/env bash

# Updates submodules and builds hexpong. Run from root of project directory

git submodule update --init

# Build jquery. Requires grunt

cd jquery
npm install
grunt --force

cd ..

# Create icons. Requires inkscape and imagemagick

inkscape --export-png=assets/images/generated/logo.master.png --export-dpi=200 --export-background-opacity=0 --without-gui logo.svg 
convert -resize 16x16 assets/images/generated/logo.master.png assets/images/generated/favicon-16.png
convert -resize 24x24 assets/images/generated/logo.master.png assets/images/generated/favicon-24.png
convert -resize 32x32 assets/images/generated/logo.master.png assets/images/generated/favicon-32.png
convert -resize 48x48 assets/images/generated/logo.master.png assets/images/generated/favicon-48.png
convert -resize 64x64 assets/images/generated/logo.master.png assets/images/generated/favicon-64.png
convert -resize 57x57 assets/images/generated/logo.master.png assets/images/generated/favicon-57.png
convert -resize 72x72 assets/images/generated/logo.master.png assets/images/generated/favicon-72.png
convert -resize 96x96 assets/images/generated/logo.master.png assets/images/generated/favicon-72.png
convert -resize 120x120 assets/images/generated/logo.master.png assets/images/generated/favicon-120.png
convert -resize 128x128 assets/images/generated/logo.master.png assets/images/generated/favicon-128.png
convert -resize 144x144 assets/images/generated/logo.master.png assets/images/generated/favicon-144.png
convert -resize 152x152 assets/images/generated/logo.master.png assets/images/generated/favicon-152.png
convert -resize 195x195 assets/images/generated/logo.master.png assets/images/generated/favicon-195.png
convert -resize 228x228 assets/images/generated/logo.master.png assets/images/generated/favicon-228.png

convert assets/images/generated/favicon-16.png assets/images/generated/favicon-24.png assets/images/generated/favicon-32.png assets/images/generated/favicon-48.png assets/images/generated/favicon-64.png assets/images/generated/favicon.ico
exit