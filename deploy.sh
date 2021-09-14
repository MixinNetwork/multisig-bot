#!/bin/sh

rm -rf ./build
mkdir build

git pull
yarn install && yarn build

SUM=`md5 -q build/index.html`
mv build/index.html build/index.$SUM.html

cp app.yaml build/app.yaml
sed -i ''  "s/index.html/index.$SUM.html/g" build/app.yaml || exit
cd build && gcloud app deploy app.yaml -q
