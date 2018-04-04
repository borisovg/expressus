# node-web-framework

A small, fast, Express-like Node.js web framework.

## Usage Example

```
const framework = require('@borisovg/web-framework');
const app = new framework.App();

app.listen(8080);

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

app.use(framework.middleware.body());
app.use(framework.middleware.json());

app.post('/foo', function (req, res) {
    console.log(req.body);
    res.json({ result: 'OK' });
});
```

## API

- **`app.get(route, callback)`**    - register GET handler
- **`app.delete(route, callback)`** - register DELETE handler
- **`app.post(route, callback)`**   - register POST handler
- **`app.put(route, callback)`**    - register PUT handler
- **`app.use(middleware)`**         - register middleware function
- **`app.close()`**                 - see [net.Server.close()](https://nodejs.org/api/net.html#net_server_close_callback)
- **`app.listen()`**                - see [net.Server.listen()](https://nodejs.org/api/net.html#net_server_listen)

## Routing

- route "/foo" will match request path "/foo"
- route "/foo/:name" will match request path like "/foo/bar" and set `req.params.name` to "bar"
- route "/foo/:name/*" will match request path like "/foo/bar/anything/else", will set `req.params.name` to "bar" and set `req.splat` to "anything/else".

Refer to the [http-hash package](https://github.com/Matt-Esch/http-hash) for more information.

## Middleware

A middleware function has the signature `(req, res, next)`, with `next` being a function that will run the next middleware in the chain.
Middleware functions are run in the order they were attached.

Some basic middleware is included in the framework.

### Request Body Loader

This middleware will load the request body and attach it to `req.body` as a buffer.

```
app.use(framework.middleware.body());
```

### Request Body JSON Parser

This middleware will parse `req.body` JSON string and replace `req.body` with the result.
It will also add a `res.json(data)` convenience method.

```
app.use(framework.middleware.body());
app.use(framework.middleware.json());
```

### Request Query String Parser

This middleware will load parse the request query string and attach it to `req.query`.

```
app.use(framework.middleware.query());
```

### Static Content Server

This middleware is a very simple static content server, aimed for use during development.
In production, consider fronting your app with a real HTTP server (e.g. Nginx) for superior performance.

```
if (process.env.NODE_ENV !== 'production') {
    app.use(framework.middleware.static({ path: './public' }));
}
```
