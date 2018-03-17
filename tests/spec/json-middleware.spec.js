/*jshint mocha:true*/
'use strict';

/**
 * Tests for lib/json-middleware.js
 * @author George Borisov <git@gir.me.uk>
 */

const expect = require('chai').expect;
const client = require('../helpers/http-client.js');
const lib = require('../../index.js');

describe('lib/json-middleware.js', function () {
    const app = new lib.App();
    const port = 10001;
    const httpRequest = client(port);

    before(function (done) {
        app.use(lib.middleware.body());
        app.listen(port, done);
    });

    after(function (done) {
        app.close(done);
    });

    it('register middleware', function () {
        app.use(lib.middleware.json());
    });

    it('creates replaces req.body with parsed JSON', function (done) {
        app.post('/test1', function (req, res) {
            res.end();
            expect(req.body.foo).to.equal('foofoo');
            done();
        });

        httpRequest('POST', '/test1', '{"foo":"foofoo"}');
    });

    it('adds res.json() which sends JSON to client', function (done) {
        app.post('/test2', function (req, res) {
            expect(typeof res.json).to.equal('function');
            res.json({ bar: 'foobar' });
        });

        httpRequest('POST', '/test2', undefined, function (res, data) {
            const json = JSON.parse(data);
            expect(json.bar).to.equal('foobar');
            expect(res.headers['content-type']).to.equal('application/json');
            done();
        });
    });

    it('returns HTTP 400 status on parse error', function (done) {
        httpRequest('POST', '/test3', 'spanner', function (res, data) {
            expect(res.statusCode).to.equal(400);
            expect(data.match(/(^\d+)/)[1]).to.equal('400');
            done();
        });
    });
});
