'use strict';

/**
 * @author George Borisov <git@gir.me.uk>
 */

const expect = require('chai').expect;
const http = require('http');

const client = require('../helpers/http-client.js');
const lib = require('../..');

describe('lib/body-middleware.js', function () {
    const app = new lib.App();
    const port = 10001;
    const httpRequest = client(port);
    let server;

    before(function (done) {
        server = http.createServer(app.router);
        server.listen(port, done);
    });

    after(function (done) {
        server.close(done);
    });

    it('register middleware', function () {
        app.use(lib.middleware.body());
    });

    it('creates req.body object that is a buffer if request has body', function (done) {
        app.post('/test', function (req, res) {
            res.end();
            expect(Buffer.isBuffer(req.body)).to.equal(true);
            expect(req.body.toString()).to.equal('foofoo');
            done();
        });

        httpRequest({ method: 'POST', path: '/test' }, 'foofoo');
    });

    it('does not create req.body if request has no body', function (done) {
        app.get('/test', function (req, res) {
            res.end();
            expect(req.body).to.equal(undefined);
            done();
        });

        httpRequest({ method: 'GET', path: '/test' });
    });
});
