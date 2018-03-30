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

    it('does not parse when there is no body', function (done) {
        app.post('/test1', function (req, res) {
            res.end();
            expect(req.body).to.equal(undefined);
            done();
        });

        httpRequest({ method: 'POST', path: '/test1' });
    });

    it('does not parse without JSON content type', function (done) {
        app.post('/test2', function (req, res) {
            res.end();
            expect(Buffer.isBuffer(req.body)).to.equal(true);
            done();
        });

        httpRequest({ method: 'POST', path: '/test2' }, '{"foo":"foofoo"}');
    });

    it('creates replaces req.body with parsed JSON', function (done) {
        app.post('/test3', function (req, res) {
            res.end();
            expect(req.body.foo).to.equal('foofoo');
            done();
        });

        httpRequest({ method: 'POST', path: '/test3', type: 'application/json' }, '{"foo":"foofoo"}');
    });

    it('adds res.json() which sends JSON to client', function (done) {
        app.post('/test4', function (req, res) {
            expect(typeof res.json).to.equal('function');
            res.json({ bar: 'foobar' });
        });

        httpRequest({ method: 'POST', path: '/test4', type: 'application/json' }, undefined, function (res, data) {
            const json = JSON.parse(data);
            expect(json.bar).to.equal('foobar');
            expect(res.headers['content-type']).to.equal('application/json');
            done();
        });
    });

    it('returns HTTP 400 status on parse error', function (done) {
        httpRequest({ method: 'POST', path: '/test5', type: 'application/json' }, 'spanner', function (res, data) {
            expect(res.statusCode).to.equal(400);
            expect(data.match(/(^\d+)/)[1]).to.equal('400');
            done();
        });
    });
});
