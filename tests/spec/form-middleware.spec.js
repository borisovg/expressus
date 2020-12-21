'use strict';

/**
 * @author George Borisov <git@gir.me.uk>
 */

const expect = require('chai').expect;
const http = require('http');

const client = require('../helpers/http-client.js');
const lib = require('../..');

describe('lib/form-middleware.js', function () {
    const app = new lib.App();
    const port = 10001;
    const httpRequest = client(port);
    let server;

    before(function (done) {
        app.use(lib.middleware.body());
        server = http.createServer(app.router);
        server.listen(port, done);
    });

    after(function (done) {
        server.close(done);
    });

    it('register middleware', function () {
        app.use(lib.middleware.form());
    });

    it('does not parse when there is no body', function (done) {
        app.post('/test1', function (req, res) {
            res.end();
            expect(req.body).to.equal(undefined);
            done();
        });

        httpRequest({ method: 'POST', path: '/test1' });
    });

    it('does not parse without form content type', function (done) {
        app.post('/test2', function (req, res) {
            res.end();
            expect(Buffer.isBuffer(req.body)).to.equal(true);
            done();
        });

        httpRequest({ method: 'POST', path: '/test2' }, 'foo=foofoo');
    });

    it('creates replaces req.body with parsed x-www-form-urlencoded data', function (done) {
        app.post('/test3', function (req, res) {
            res.end();
            expect(req.body.foo).to.equal('foofoo');
            expect(req.body['/bar']).to.equal('/bar');
            done();
        });

        httpRequest({ method: 'POST', path: '/test3', type: 'application/x-www-form-urlencoded' }, 'foo=foofoo&%2Fbar=%2Fbar');
    });

    it('returns HTTP 400 status on invalid form data', function (done) {
        httpRequest({ method: 'POST', path: '/test5', type: 'application/x-www-form-urlencoded' }, 'spanner', function (res, data) {
            expect(res.statusCode).to.equal(400);
            expect(data.match(/(^\d+)/)[1]).to.equal('400');
            done();
        });
    });
});
