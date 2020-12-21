all: help

## build:  build TypeScript source
.PHONY: build
build: node_modules
	./node_modules/.bin/tsc

## clean: delete NPM packages and generated files
.PHONY: clean
clean:
	rm -rf dist node_modules
	rm -f npm-debug.log
	cd tests && make clean

.PHONY: coverage
coverage:
	cd tests && make coverage

## test:  run tests
.PHONY: test
test: node_modules build
	cd tests && make

.PHONY: help
help:
	@sed -n 's/^##//p' Makefile

node_modules: package.json
	npm update || (rm -rf node_modules; exit 1)
	touch node_modules
