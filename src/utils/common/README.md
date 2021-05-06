1. go get -u github.com/gopherjs/gopherjs
2. download go1.16.x and tar xvf in current dir
3. export GOPHERJS_GOROOT="$(./go/bin/go env GOROOT)"
4. ./go/bin/go get
5. MixinNetwork/mixin checkout to v0.12.1
6. gopherjs build
7. mv common.js ../transaction.js

For react
add /* eslint-disable */ to transaction.js
