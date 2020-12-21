all: node_modules test

LCOV = coverage/coverage.lcov

## clean:  delete NPM packages and generated files
.PHONY: clean
clean:
	rm -rf \
		.nyc_output \
		../node_modules/.cache/nyc \
		coverage \
		node_modules \
		package-lock.json
	rm -f npm-debug.log

.PHONY: coverage
coverage:
	./node_modules/.bin/nyc report \
		--cache-dir=./.nyc_cache \
		--cwd ../ \
		--temp-directory=./tests/.nyc_output \
		--reporter=text-lcov \
		> $(LCOV)
	./node_modules/.bin/codecov \
		-f $(LCOV)

## test:   run the tests (default target)
.PHONY: test
test:
	./node_modules/.bin/nyc \
		--all \
		--cache-dir=./.nyc_cache \
		--cwd ../ \
		--exclude local/** \
		--exclude tests/** \
		--report-dir=./tests/coverage \
		--reporter=none \
		--temp-dir=./tests/.nyc_output \
		node_modules/.bin/mocha -b --recursive spec
	./node_modules/.bin/nyc report \
		--cwd ../ \
		--report-dir=./tests/coverage \
		--temp-dir=./tests/.nyc_output \
		--reporter=html \
		--reporter=text

.PHONY: help
help:
	@sed -n 's/^##//p' Makefile

node_modules: package.json
	npm update || (rm -rf node_modules; exit 1)
	touch node_modules
