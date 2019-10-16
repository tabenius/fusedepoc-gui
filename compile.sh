#!/bin/bash -x 
handler() {
  kill -s SIGINT $pid
}
trap handler SIGINT
while true; do 
  echo "Transpiling with babel. Send SIGINT (Ctrl-c) when you want to browserify"
  node_modules/.bin/babel --presets react,es2015 --watch src/ --out-dir static/js &
  pid=$!
  wait $pid
  echo Browserifying
  #bsfy=browserify
  bsfy=./node_modules/.bin/browserify
    $bsfy static/js/main.js > static/js/main.min.js
done

