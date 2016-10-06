all: tstojs game editor minify

tstojs:
	tsc

game: tstojs
	browserify --outfile build/build.js build/main.js

editor: tstojs
	browserify --outfile build/editor-build.js build/editor/main.js

minify: tstojs game editor
	uglifyjs build/build.js --output build/build.min.js --compress --mangle
	uglifyjs build/editor-build.js --output build/editor-build.min.js --compress --mangle

clean:
	rm -rf build/*
