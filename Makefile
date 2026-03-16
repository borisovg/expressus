NPM := pnpm
NPM_LOCK := pnpm-lock.yaml
TS_FILES := $(shell find src/ -name '*.ts')
NPM_BIN := ./node_modules/.bin

all: dist

## help:		show this help
.PHONY: help
help:
	@sed -n 's/^##//p' Makefile | sort

## clean: 	delete generated files
.PHONY: clean
clean:
	rm -rf coverage dist node_modules $(NPM_LOCK)

## ci: 		run tests and remove dev dependencies
.PHONY: ci
ci: test dist
	$(NPM) prune --prod
	rm $(NPM_LOCK)

dist: node_modules $(TS_FILES) tsconfig.json Makefile
	rm -rf $@
	$(NPM_BIN)/tsc -p tsconfig-build.json || rm -rf $@

## lint:		run linter checks
.PHONY: lint
lint: node_modules
	$(NPM_BIN)/biome check --write --error-on-warnings

node_modules: package.json $(NPM_LOCK)
	$(NPM) install || (rm -rf $@; exit 1)
	test -d $@ && touch $@ || true

## start-dev:	start application in development mode
.PHONY: start-dev
start-dev: node_modules
	while true; do LOG_LEVEL=debug $(NPM_BIN)/tsx watch ./src/index.ts; sleep 1; done

## test:		run unit tests (set FILE env variable to run test for that file only)
.PHONY: test
ifdef FILE
test: node_modules
	$(NPM_BIN)/vitest $(FILE)
else
test: node_modules
	$(NPM_BIN)/vitest --coverage --run --coverage.exclude="src/*.d.ts"
endif

## test-watch:	run unit tests in watch mode
.PHONY: test-watch
test-watch: node_modules
	$(NPM_BIN)/vitest

$(NPM_LOCK):
	$(NPM) install && touch $@
