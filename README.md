[![Tests](https://github.com/borisovg/expressus/actions/workflows/tests.yaml/badge.svg)](https://github.com/borisovg/expressus/actions/workflows/tests.yaml)
[![Coverage Status](https://img.shields.io/codecov/c/github/borisovg/expressus/master.svg?style=flat-square)](https://codecov.io/gh/borisovg/expressus/)

# expressus

A small, fast, Express-like Node.js web framework.

## Installation

```
npm install --save @borisov/expressus
```

## Usage Example

```
const { App, middleware } = require('@borisovg/expressus');
const { createServer } = require('http');

const app = new App();
const server = createServer(app.router);

server.listen(8080);

// simple GET route

app.get('/foo', function (req, res) {
    res.end('OK');
});

// GET route with params (e.g. /foo/bar/baz)

app.get('/foo/:a/:b', function (req, res) {
    console.log(req.params);
    res.end('OK');
});

// JSON POST route

app.use(middleware.json());

app.post('/foo', function (req, res) {
    console.log(req.body);
    res.json({ result: 'OK' });
});
```

## TypeScript Example

When using any of the included middleware, or if you add custom middleware that modifies the request or response object passed to the handler you can pass additional type information to the generic `App` class.

```
import { App, middleware } from '@borisovg/expressus';
import type { JsonRequest, JsonResponse, QueryRequest } from '@borisovg/expressus';

const app = new App<JsonRequest & QueryRequest, JsonResponse>();
const server = createServer(app.router);

server.listen(8080);

app.use(middleware.json());
app.use(middleware.query());

app.get('/foo/:bar', function (req, res) {
    // req.body, req.params.bar, req.query and res.json will be typed
});
```

## API

- **`framework.App()`** - application constructor
- **`app.get(route, callback)`** - register GET handler
- **`app.delete(route, callback)`** - register DELETE handler
- **`app.patch(route, callback)`** - register PATCH handler
- **`app.post(route, callback)`** - register POST handler
- **`app.put(route, callback)`** - register PUT handler
- **`app.remove_all_handlers()`** - remove all handlers
- **`app.remove_middleware(fn)`** - remove middleware function
- **`app.router(req, res)`** - router function (use as request callback for HTTP server)
- **`app.use(fn)`** - register middleware function

## Routing

- route "/foo" will match request path "/foo"
- route "/foo/:name" will match request path like "/foo/bar" and set `req.params.name` to "bar"
- route "/foo/:name/\*" will match request path like "/foo/bar/anything/else", will set `req.params.name` to "bar" and set `req.splat` to "anything/else"
- raw route string is used as `req.route`

Refer to the [http-hash package](https://github.com/Matt-Esch/http-hash) for more information.

## Middleware

A middleware function has the signature `(req, res, next)`, with `next` being a function that will run the next middleware in the chain.
Middleware functions are run in the order they were attached.

Some basic middleware is included in the framework.

### Request Body Loader

This middleware will load the request body and attach it to `req.body` as a buffer.

```
app.use(middleware.body());
```

### Request Body Form Parser

This middleware will parse `req.body` form data and replace `req.body` with the result.

```
app.use(middleware.form());
```

### Request Body JSON Parser

This middleware will parse `req.body` JSON data and replace `req.body` with the result.
It will also add a `res.json(data)` convenience method.

```
app.use(middleware.json());
```

### Request Query String Parser

This middleware will load parse the request query string and attach it to `req.query`.

```
app.use(middleware.query());
```

### Static Content Server

This middleware is a very simple static content server, aimed for use during development.
In production, consider fronting your app with a real HTTP server (e.g. Nginx) for superior performance.

```
if (process.env.NODE_ENV !== 'production') {
    app.use(middleware.static({ path: './public' }));
}
```
