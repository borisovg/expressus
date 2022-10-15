/**
 * @author George Borisov <git@gir.me.uk>
 */

import { strictEqual } from 'node:assert';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { makeClient } from '../test-helpers/http-client';
import { App, middleware } from '..';
import type { RequestWithForm } from '..';

describe('lib/form-middleware', () => {
  const app = new App();
  const port = 10001;
  const httpRequest = makeClient(port);
  let server: Server;

  before((done) => {
    server = createServer(app.router);
    server.listen(port, done);
  });

  after((done) => server.close(done));

  afterEach(() => app.remove_all_handlers());

  it('register middleware', () => {
    app.use(middleware.form());
  });

  it('does not parse when there is no body', (done) => {
    app.post('/test', (req: RequestWithForm, res) => {
      res.end();
      strictEqual(req.body, undefined);
      done();
    });

    httpRequest({ method: 'POST', path: '/test' });
  });

  it('does not parse without form content type', (done) => {
    app.post('/test', (req: RequestWithForm, res) => {
      res.end();
      strictEqual(req.body, undefined);
      done();
    });

    httpRequest(
      { method: 'POST', path: '/test', type: 'text/plain' },
      'foo=foofoo'
    );
  });

  it('does not parse if request body is empty', (done) => {
    app.post('/test', (req: RequestWithForm, res) => {
      res.end();
      strictEqual(req.body, undefined);
      done();
    });

    httpRequest(
      {
        method: 'POST',
        path: '/test',
        type: 'application/x-www-form-urlencoded',
      },
      ''
    );
  });

  it('creates replaces req.body with parsed x-www-form-urlencoded data', (done) => {
    app.post('/test', (req: RequestWithForm, res) => {
      res.end();
      strictEqual(req.body?.foo, 'foofoo');
      strictEqual(req.body?.['/bar'], '/bar');
      done();
    });

    httpRequest(
      {
        method: 'POST',
        path: '/test',
        type: 'application/x-www-form-urlencoded',
      },
      'foo=foofoo&%2Fbar=%2Fbar'
    );
  });

  it('returns HTTP 400 status on invalid form data', (done) => {
    httpRequest(
      {
        method: 'POST',
        path: '/test',
        type: 'application/x-www-form-urlencoded',
      },
      'spanner',
      (res, data) => {
        strictEqual(res.statusCode, 400);
        strictEqual(data.match(/(^\d+)/)?.[1], '400');
        done();
      }
    );
  });
});
