/**
 * @author George Borisov <git@gir.me.uk>
 */

import { strictEqual } from 'assert';
import fs from 'fs';
import { createServer } from 'http';
import type { Server } from 'http';
import { createSandbox } from 'sinon';
import { makeClient } from '../test-helpers/http-client';
import { App, middleware } from '..';

describe('lib/static-middleware.js', () => {
  const app = new App();
  const port = 10001;
  const httpRequest = makeClient(port);
  const sandbox = createSandbox();
  let server: Server;

  before((done) => {
    server = createServer(app.router);
    server.listen(port, done);
  });

  after((done) => server.close(done));

  afterEach(() => sandbox.restore());

  it('defaults to "./public" for path', (done) => {
    app.use(middleware.static());

    sandbox.replace(fs, 'access', ((path, _mode, callback) => {
      strictEqual(path, './public/pixel.png');
      callback(new Error('spanner'));
      app.remove_middleware();
      done();
    }) as typeof fs.access);

    httpRequest({ method: 'GET', path: '/pixel.png' });
  });

  it('register middleware with path option', () => {
    app.use(middleware.static({ path: './src/test-helpers/public' }));
  });

  it('it serves static files', (done) => {
    fs.readFile('./src/test-helpers/public/test.txt', (_err, buffer) => {
      httpRequest(
        { method: 'GET', path: '/test.txt' },
        undefined,
        (res, data) => {
          strictEqual(res.headers['content-type'], 'text/plain; charset=utf-8');
          strictEqual(data, buffer.toString());

          fs.readFile('./src/test-helpers/public/pixel.png', (_err, buffer) => {
            httpRequest(
              { method: 'GET', path: '/pixel.png' },
              undefined,
              (res, data) => {
                strictEqual(res.headers['content-type'], 'image/png');
                strictEqual(data, buffer.toString());
                done();
              }
            );
          });
        }
      );
    });
  });

  it('sets "content-type" header to "application/octet-stream" for unknown file types', (done) => {
    httpRequest({ method: 'GET', path: '/test.xxx' }, undefined, (res) => {
      strictEqual(res.headers['content-type'], 'application/octet-stream');
      done();
    });
  });

  it('only considers GET requests', (done) => {
    app.post('/test1.txt', (_req, res) => {
      res.end();
      done();
    });

    httpRequest({ method: 'POST', path: '/test1.txt' });
  });

  it('ignores routes without extension', (done) => {
    app.get('/test2', (_req, res) => {
      res.end();
      done();
    });

    httpRequest({ method: 'GET', path: '/test2' });
  });

  it('ignores routes that include ".." string', (done) => {
    app.get('/../test3.txt', (_req, res) => {
      res.end();
      done();
    });

    httpRequest({ method: 'GET', path: '/../test3.txt' });
  });

  it('continues to dynamic router if file not found', (done) => {
    app.get('/test4.txt', (_req, res) => {
      res.end();
      done();
    });

    httpRequest({ method: 'GET', path: '/test4.txt' });
  });

  it('returns HTTP 500 status on file access error', (done) => {
    fs.chmod('./src/test-helpers/public/pixel.png', '222', (err) => {
      strictEqual(err, null);

      httpRequest(
        { method: 'GET', path: '/pixel.png' },
        undefined,
        (res, data) => {
          strictEqual(res.statusCode, 500);
          strictEqual(data.match(/(^\d+)/)?.[1], '500');

          fs.chmod('./src/test-helpers/public/pixel.png', '644', (err) => {
            strictEqual(err, null);
            done();
          });
        }
      );
    });
  });

  it('returns HTTP 500 error on file stat error', (done) => {
    sandbox.replace(fs, 'stat', ((_path, callback) => {
      if (typeof callback === 'function')
        callback(new Error('spanner'), {} as fs.Stats);
    }) as typeof fs.stat);

    httpRequest(
      { method: 'GET', path: '/pixel.png' },
      undefined,
      (res, data) => {
        strictEqual(res.statusCode, 500);
        strictEqual(data.match(/(^\d+)/)?.[1], '500');
        done();
      }
    );
  });

  it('handles edge case where URL is undefined on the request', (done) => {
    middleware.static()({} as any, {} as any, () => {
      done();
    });
  });
});
