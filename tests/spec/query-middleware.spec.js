/*jshint mocha:true*/
'use strict';

/**
 * Tests for lib/query-middleware.js
 * @author George Borisov <git@gir.me.uk>
 */

const expect = require('chai').expect;
const client = require('../helpers/http-client.js');
const lib = require('../../index.js');

describe('lib/query-middleware.js', function () {
    const app = new lib.App();
    const path = '/test?foo=foofoo';
    const port = 10001;
    const httpRequest = client(port);
    var r;

    before(function (done) {
        app.listen(port, done);
    });

    after(function (done) {
        app.close(done);
    });

    it('register middleware', function () {
        app.use(lib.middleware.query());
    });

    it('creates req.query object', function (done) {
        app.get('/test', function (req, res) {
            r = req;
            res.end();
            expect(req.query.foo).to.equal('foofoo');
            done();
        });

        httpRequest({ method: 'GET', path });
    });

    it('trims req.url down to path', function () {
        expect(r.url).to.equal('/test');
    });

    it('adds req.originalUrl property with original request URL', function () {
        expect(r.originalUrl).to.equal(path);
    });
});
