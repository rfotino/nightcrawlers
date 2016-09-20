all:
	tsc
	browserify --outfile build/build.js build/main.js
	uglifyjs build/build.js --output build/build.min.js --compress --mangle

clean:
	rm -f build/*.js
