/**
 * @author George Borisov <git@gir.me.uk>
 */

import { deepStrictEqual, strictEqual } from 'assert';
import { createServer } from 'http';
import type { Server } from 'http';
import { makeClient } from '../test-helpers/http-client';
import { App, middleware } from '..';
import type { QueryRequest, Response } from '..';
import type { RequestWithQuery } from './query-middleware';

describe('lib/query-middleware', () => {
  const app = new App<QueryRequest>();
  const path = '/test?foo=foofoo';
  const port = 10001;
  const httpRequest = makeClient(port);
  let r: QueryRequest;
  let server: Server;

  before((done) => {
    server = createServer(app.router);
    server.listen(port, done);
  });

  after((done) => server.close(done));

  it('register middleware', () => {
    app.use(middleware.query());
  });

  it('creates req.query object', (done) => {
    app.get('/test', (req, res) => {
      r = req;
      res.end();
      strictEqual(req.query.foo, 'foofoo');
      done();
    });

    httpRequest({ method: 'GET', path });
  });

  it('trims req.url down to path', () => {
    strictEqual(r.url, '/test');
  });

  it('adds req.originalUrl property with original request URL', () => {
    strictEqual(r.originalUrl, path);
  });

  it('handles edge case where URL is undefined on the request', (done) => {
    const req = { headers: { host: 'example.com' } } as RequestWithQuery;

    middleware.query()(req, {} as Response, () => {
      deepStrictEqual(req.query, {});
      strictEqual(req.originalUrl, undefined);
      strictEqual(req.url, '/');
      done();
    });
  });
});
