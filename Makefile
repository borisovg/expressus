all: help

## build:  build TypeScript source
.PHONY: build
build: node_modules
	./node_modules/.bin/tsc || (rm -rf dist; exit 1)

## clean: delete NPM packages and generated files
.PHONY: clean
clean:
	rm -rf dist node_modules package-lock.json npm-debug.log .nyc* coverage

.PHONY: coverage
coverage:
	./node_modules/.bin/c8 report > $(LCOV)
	./node_modules/.bin/codecov -f $(LCOV)

## test:  run tests
.PHONY: test
test: node_modules build
	./node_modules/.bin/c8 \
		--reporter=none \
		./node_modules/.bin/ts-mocha -b 'src/**/*.spec.ts' \
			&& ./node_modules/.bin/c8 report \
				--all \
				--bail \
				--clean \
				--reporter=html \
				--reporter=text \
				-n src \
				-x 'src/**/*.spec.ts' \
				-x 'src/http-hash.d.ts' \
				-x 'src/types.*'

.PHONY: help
help:
	@sed -n 's/^##//p' Makefile

node_modules: package.json
	npm update || (rm -rf node_modules; exit 1)
	touch node_modules
