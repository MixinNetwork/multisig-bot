1. go get -u github.com/gopherjs/gopherjs
2. download go1.16.5 and tar xvf in current dir
3. export GOPHERJS_GOROOT="$(./go/bin/go env GOROOT)"
4. GO111MODULE=off gopherjs get
5. gopherjs build -o common.js
6. mv common.js ../transaction.js
