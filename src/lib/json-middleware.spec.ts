/**
 * @author George Borisov <git@gir.me.uk>
 */

import { strictEqual } from 'assert';
import { createServer } from 'http';
import type { Server } from 'http';
import { makeClient } from '../test-helpers/http-client';
import { App, middleware } from '..';
import type { JsonRequest, JsonResponse } from '..';

describe('lib/json-middleware', () => {
  const app = new App<JsonRequest, JsonResponse>();
  const port = 10001;
  const httpRequest = makeClient(port);
  let server: Server;

  before((done) => {
    server = createServer(app.router);
    server.listen(port, done);
  });

  beforeEach(() => {
    app.remove_all_handlers();
    app.remove_middleware();
    app.use(middleware.json());
  });

  after((done) => server.close(done));

  it('does not parse when there is no body', (done) => {
    app.post('/test', (req, res) => {
      res.end();
      strictEqual(req.body, undefined);
      done();
    });

    httpRequest({ method: 'POST', path: '/test' });
  });

  it('does not parse without JSON content type', (done) => {
    app.post('/test', (req, res) => {
      res.end();
      strictEqual(req.body, undefined);
      done();
    });

    httpRequest({ method: 'POST', path: '/test' }, '{"foo":"foofoo"}');
  });

  it('creates replaces req.body with parsed JSON', (done) => {
    app.post('/test', (req, res) => {
      res.end();
      strictEqual((req.body as Record<string, unknown>).foo, 'foofoo');
      done();
    });

    httpRequest(
      { method: 'POST', path: '/test', type: 'application/json' },
      '{"foo":"foofoo"}',
    );
  });

  it('creates replaces req.body with parsed JSON when "content-type" includes charset', (done) => {
    app.post('/test', (req, res) => {
      res.end();
      strictEqual((req.body as Record<string, unknown>).foo, 'foofoo');
      done();
    });

    httpRequest(
      {
        method: 'POST',
        path: '/test',
        type: 'application/json;charset=utf-8',
      },
      '{"foo":"foofoo"}',
    );
  });

  (['get', 'post'] as const).forEach((method) => {
    it('adds res.json() which sends JSON to client', (done) => {
      app[method]('/test', (_req, res) => {
        res.json({ bar: 'foobar' });
      });

      httpRequest(
        {
          method: method.toUpperCase(),
          path: '/test',
          type: 'application/json',
        },
        undefined,
        (res, data) => {
          const json = JSON.parse(data);
          strictEqual(json.bar, 'foobar');
          strictEqual(res.headers['content-type'], 'application/json');
          done();
        },
      );
    });
  });

  it('returns HTTP 400 status on parse error', (done) => {
    httpRequest(
      { method: 'POST', path: '/test', type: 'application/json' },
      'spanner',
      (res, data) => {
        const json = JSON.parse(data);
        strictEqual(json.code, 400);
        strictEqual(res.statusCode, 400);
        done();
      },
    );
  });
});
