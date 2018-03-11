/*jshint mocha:true*/
'use strict';

/**
 * Tests for lib/App.js
 * @author George Borisov <git@gir.me.uk>
 */

const expect = require('chai').expect;
const client = require('../helpers/http-client.js');
const lib = require('../../index.js');

describe('lib/App.js', function () {
    const port = 10001;
    const httpRequest = client(port);
    var app;

    it('creates HTTP server when called with no options', function () {
        app = new lib.App();
    });

    it('forwards listen() call to server', function (done) {
        app.listen(port, done);
    });

    ['delete', 'get', 'post', 'put'].forEach(function (k) {
        const m = k.toUpperCase();

        it(`registers ${m} handler`, function (done) {
            app[k]('/test/:foo', function (req, res) {
                expect(req.method).to.equal(m);
                expect(req.url).to.equal('/test/foofoo');
                expect(req.params.foo).to.equal('foofoo');

                req.on('data', function (buffer) {
                    expect(buffer.toString()).to.equal('bar');
                });

                res.end('foo');
            });

            httpRequest(m, '/test/foofoo', 'bar', function (res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data).to.equal('foo');
                done();
            });
        });

    });

    it('registers middleware and applies it to request', function (done) {
        var semaphore = 2;

        function mw (req, res, next) {
            expect(req.url).to.equal('/test/foofoo');
            expect(typeof res.end).to.equal('function');
            expect(typeof next).to.equal('function');

            semaphore -= 1;
            next();
        }

        for (let i = 0; i < 2; i += 1) {
            app.use(mw);
        }

        expect(app._middleware.length).to.equal(2);

        httpRequest('GET', '/test/foofoo', undefined, function (res, data) {
            expect(res.statusCode).to.equal(200);
            expect(data).to.equal('foo');
            expect(semaphore).to.equal(0);

            app._middleware = [];
            done();
        });
    });

    it('returns 404 in strange method', function (done) {
        httpRequest('ACL', '/test/foofoo', undefined, function (res, data) {
            expect(res.statusCode).to.equal(404);
            expect(typeof data).to.equal('string');
            done();
        });
    });

    it('returns 404 in unknown route', function (done) {
        httpRequest('GET', '/spanner', undefined, function (res, data) {
            expect(res.statusCode).to.equal(404);
            expect(typeof data).to.equal('string');
            done();
        });
    });

    it('forwards close() call to server', function (done) {
        app.close(done);
    });
});
