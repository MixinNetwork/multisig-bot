1. go get -u github.com/gopherjs/gopherjs
2. download go1.17.1 and tar xvf in current dir
3. export GOPHERJS_GOROOT="$(./go/bin/go env GOROOT)"
4. gopherjs get
5. gopherjs build -m -o common.js
6. mv common.js ../transaction.js
