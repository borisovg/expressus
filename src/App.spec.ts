/**
 * @author George Borisov <git@gir.me.uk>
 */

import { strictEqual } from 'assert';
import http from 'http';
import { makeClient } from './test-helpers/http-client';
import * as lib from '.';

type MiddlewareFn = ReturnType<typeof lib.middleware.body>;

describe('lib/App.js', () => {
  const port = 10001;
  const httpRequest = makeClient(port);
  const path = '/test/foofoo/bar/baz';
  let app: lib.App;
  let server: http.Server;

  after((done) => server.close(done));

  it('creates HTTP server when called with no options', () => {
    app = new lib.App();
  });

  it('exposes request handler as app.router', (done) => {
    strictEqual(typeof app.router, 'function');
    server = http.createServer(app.router);
    server.listen(port, done);
  });

  (['delete', 'get', 'options', 'patch', 'post', 'put'] as const).forEach(
    (k) => {
      const m = k.toUpperCase();

      it(`registers ${m} handler`, (done) => {
        app[k]('/test/:foo/*', (req, res) => {
          strictEqual(req.method, m);
          strictEqual(req.url, path);
          strictEqual(req.params.foo, 'foofoo');
          strictEqual(req.route, '/test/:foo/*');
          strictEqual(req.splat, 'bar/baz');

          req.on('data', (buffer) => {
            strictEqual(buffer.toString(), 'bar');
          });

          res.end('foo');
        });

        httpRequest({ method: m, path }, 'bar', (res, data) => {
          strictEqual(res.statusCode, 200);
          strictEqual(data, 'foo');
          done();
        });
      });
    },
  );

  it('registers middleware and applies it to request', (done) => {
    let semaphore = 2;

    const mw: MiddlewareFn = (req, res, next) => {
      strictEqual(req.url, path);
      strictEqual(typeof res.end, 'function');
      strictEqual(typeof next, 'function');

      semaphore -= 1;
      next();
    };

    for (let i = 0; i < 2; i += 1) {
      app.use(mw);
    }

    httpRequest({ method: 'GET', path }, undefined, (res, data) => {
      strictEqual(res.statusCode, 200);
      strictEqual(data, 'foo');
      strictEqual(semaphore, 0);

      app.remove_middleware();
      done();
    });
  });

  it('returns 404 in strange method', (done) => {
    httpRequest({ method: 'ACL', path }, undefined, (res, data) => {
      strictEqual(res.statusCode, 404);
      strictEqual(typeof data, 'string');
      done();
    });
  });

  it('returns 404 in unknown route', (done) => {
    httpRequest({ method: 'GET', path: '/spanner' }, undefined, (res, data) => {
      strictEqual(res.statusCode, 404);
      strictEqual(typeof data, 'string');
      done();
    });
  });

  it('removes all handlers', (done) => {
    app.remove_all_handlers();

    httpRequest({ method: 'GET', path }, undefined, (res) => {
      strictEqual(res.statusCode, 404);
      done();
    });
  });

  it('remove_middleware() idempotently removes middleware', (done) => {
    let counter = 0;

    const mw: MiddlewareFn = (_req, _res, next) => {
      counter += 1;
      next();
    };

    app.use(mw);

    httpRequest({ method: 'GET', path }, undefined, () => {
      strictEqual(counter, 1);

      app.remove_middleware(mw);

      httpRequest({ method: 'GET', path }, undefined, () => {
        strictEqual(counter, 1);
        app.remove_middleware(mw);
        done();
      });
    });
  });

  it('correctly strips hashes and queries', (done) => {
    const paths = [
      '/foo/bar?abc=123',
      '/foo/bar#baz',
      '/foo/bar?abc=123#baz',
      '/foo/bar#baz?abc=123',
    ];

    (function loop(i) {
      app.remove_all_handlers();
      app.remove_middleware();

      const route = '/foo/:bar';
      const path = paths[i];
      if (!path) return done();

      app.get(route, (req, res) => {
        strictEqual(req.route, route);
        strictEqual(req.url, path);
        res.end();
      });

      httpRequest({ method: 'GET', path }, undefined, (res) => {
        strictEqual(res.statusCode, 200);
        loop(i + 1);
      });
    })(0);
  });
});
