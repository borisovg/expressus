/**
 * @author George Borisov <git@gir.me.uk>
 */
'use strict';

const expect = require('chai').expect;
const http = require('http');

const client = require('../helpers/http-client.js');
const lib = require('../..');

describe('lib/json-middleware.js', () => {
  const app = new lib.App();
  const port = 10001;
  const httpRequest = client(port);
  let server;

  before((done) => {
    app.use(lib.middleware.body());
    server = http.createServer(app.router);
    server.listen(port, done);
  });

  after((done) => server.close(done));

  it('register middleware', () => {
    app.use(lib.middleware.json());
  });

  it('does not parse when there is no body', (done) => {
    app.post('/test1', (req, res) => {
      res.end();
      expect(req.body).to.equal(undefined);
      done();
    });

    httpRequest({ method: 'POST', path: '/test1' });
  });

  it('does not parse without JSON content type', (done) => {
    app.post('/test2', (req, res) => {
      res.end();
      expect(Buffer.isBuffer(req.body)).to.equal(true);
      done();
    });

    httpRequest({ method: 'POST', path: '/test2' }, '{"foo":"foofoo"}');
  });

  it('creates replaces req.body with parsed JSON', (done) => {
    app.post('/test3a', (req, res) => {
      res.end();
      expect(req.body.foo).to.equal('foofoo');
      done();
    });

    httpRequest(
      { method: 'POST', path: '/test3a', type: 'application/json' },
      '{"foo":"foofoo"}'
    );
  });

  it('creates replaces req.body with parsed JSON when "content-type" includes charset', (done) => {
    app.post('/test3b', (req, res) => {
      res.end();
      expect(req.body.foo).to.equal('foofoo');
      done();
    });

    httpRequest(
      {
        method: 'POST',
        path: '/test3b',
        type: 'application/json;charset=utf-8',
      },
      '{"foo":"foofoo"}'
    );
  });

  it('adds res.json() which sends JSON to client', (done) => {
    app.post('/test4', (req, res) => {
      expect(typeof res.json).to.equal('function');
      res.json({ bar: 'foobar' });
    });

    httpRequest(
      { method: 'POST', path: '/test4', type: 'application/json' },
      undefined,
      (res, data) => {
        const json = JSON.parse(data);
        expect(json.bar).to.equal('foobar');
        expect(res.headers['content-type']).to.equal('application/json');
        done();
      }
    );
  });

  it('returns HTTP 400 status on parse error', (done) => {
    httpRequest(
      { method: 'POST', path: '/test5', type: 'application/json' },
      'spanner',
      (res, data) => {
        const json = JSON.parse(data);
        expect(json.code).to.equal(400);
        expect(res.statusCode).to.equal(400);
        done();
      }
    );
  });
});
