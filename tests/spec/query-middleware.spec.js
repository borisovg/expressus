/**
 * @author George Borisov <git@gir.me.uk>
 */
'use strict';

const expect = require('chai').expect;
const http = require('http');

const client = require('../helpers/http-client.js');
const lib = require('../..');

describe('lib/query-middleware.js', () => {
  const app = new lib.App();
  const path = '/test?foo=foofoo';
  const port = 10001;
  const httpRequest = client(port);
  let r, server;

  before((done) => {
    server = http.createServer(app.router);
    server.listen(port, done);
  });

  after((done) => server.close(done));

  it('register middleware', () => {
    app.use(lib.middleware.query());
  });

  it('creates req.query object', (done) => {
    app.get('/test', (req, res) => {
      r = req;
      res.end();
      expect(req.query.foo).to.equal('foofoo');
      done();
    });

    httpRequest({ method: 'GET', path });
  });

  it('trims req.url down to path', () => {
    expect(r.url).to.equal('/test');
  });

  it('adds req.originalUrl property with original request URL', () => {
    expect(r.originalUrl).to.equal(path);
  });

  it('handles edge case where URL is undefined on the request', (done) => {
    const req = { headers: { host: 'example.com' } };

    lib.middleware.query()(req, null, () => {
      expect(req.query).to.eql({});
      expect(req.originalUrl).to.equal(undefined);
      expect(req.url).to.equal('/');
      done();
    });
  });
});
