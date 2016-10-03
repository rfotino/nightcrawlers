all:
	tsc
	browserify --outfile build/build.js build/main.js
	uglifyjs build/build.js --output build/build.min.js --compress --mangle

editor:
	tsc
	browserify --outfile build/editor-build.js build/editor/main.js
	uglifyjs build/editor-build.js --output build/editor-build.min.js --compress --mangle

clean:
	rm -f build/*.js
