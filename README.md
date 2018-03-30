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
