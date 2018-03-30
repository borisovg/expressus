# node-web-framework

A small, fast, Express-like Node.js web framework.

## API

- **`app.get(route, callback)`**    - register GET handler
- **`app.delete(route, callback)`** - register DELETE handler
- **`app.post(route, callback)`**   - register POST handler
- **`app.put(route, callback)`**    - register PUT handler
- **`app.use(middleware)`**         - register middleware function
- **`app.close()`**                 - see [net.Server.close()](https://nodejs.org/api/net.html#net_server_close_callback)
- **`app.listen()`**                - see [net.Server.listen()](https://nodejs.org/api/net.html#net_server_listen)

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
