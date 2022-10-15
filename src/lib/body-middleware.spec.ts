/**
 * @author George Borisov <git@gir.me.uk>
 */
'use strict';

import assert from 'node:assert';
import { createServer } from 'node:http';
import type { Server, ServerResponse } from 'node:http';
import { Readable, Writable } from 'node:stream';
import { makeClient } from '../test-helpers/http-client';
import { App, middleware } from '..';
import type { RequestWithBody } from '..';

describe('lib/body-middleware.js', () => {
  const app = new App();
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
    app.use(middleware.body());
  });

  after((done) => server.close(done));

  it('creates req.body object that is a buffer if request has body', (done) => {
    app.post('/test', (req: RequestWithBody, res) => {
      res.end();
      assert.strictEqual(Buffer.isBuffer(req.body), true);
      assert.strictEqual(req.body?.toString(), 'foofoo');
      done();
    });

    httpRequest({ method: 'POST', path: '/test' }, 'foofoo');
  });

  it('does not create req.body for JSON content type', (done) => {
    app.post('/test', (req: RequestWithBody, res) => {
      res.end();
      assert.strictEqual(req.body, undefined);
      done();
    });

    httpRequest(
      { method: 'POST', path: '/test', type: 'application/json' },
      '{"foo":"foofoo"}'
    );
  });

  it('does not create req.body if request has no body', (done) => {
    app.post('/test', (req: RequestWithBody, res) => {
      res.end();
      assert.strictEqual(req.body, undefined);
      done();
    });

    httpRequest({ method: 'POST', path: '/test' });
  });

  (['get', 'delete', 'options'] as const).forEach((method) => {
    it(`does nothing for ${method.toUpperCase()} method`, (done) => {
      app[method]('/test', (req: RequestWithBody, res) => {
        res.end();
        assert.strictEqual(req.body, undefined);
        done();
      });

      httpRequest({ method, path: '/test' }, 'foofoo');
    });
  });

  it('returns 400 on error', (done) => {
    const mw = middleware.body();
    const req = new Readable({ read() {} }) as RequestWithBody;
    const res = new Writable({
      write(buf) {
        assert.strictEqual(buf.toString(), '400 Bad Request (test)');
        setImmediate(done);
      },
    }) as ServerResponse;

    setImmediate(() => req.emit('error', new Error('test')));

    mw(req, res, () => {
      throw new Error('this should not happen');
    });
  });
});
