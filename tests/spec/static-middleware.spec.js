/*jshint mocha:true*/
'use strict';

/**
 * Tests for lib/static-middleware.js
 * @author George Borisov <git@gir.me.uk>
 */

const chai = require('chai');
const fs = require('fs');

const client = require('../helpers/http-client.js');
const lib = require('../../index.js');

const expect = chai.expect;
const util = chai.util;

describe('lib/static-middleware.js', function () {
    const app = new lib.App();
    const port = 10001;
    const httpRequest = client(port);

    before(function (done) {
        app.listen(port, done);
    });

    after(function (done) {
        app.close(done);
    });

    it('defaults to "./public" for path', function (done) {
        app.use(lib.middleware.static());

        util.overwriteMethod(fs, 'access', function (self) {
            return function (path, mode, callback) {
                fs.access = self;
                expect(path).to.equal('./public/pixel.png');
                callback(new Error('spanner'));
                app._middleware = [];
                done();
            };
        });

        httpRequest('GET', '/pixel.png');
    });

    it('register middleware with path option', function () {
        app.use(lib.middleware.static({ path: './helpers/public' }));
    });

    it('it serves static files', function (done) {
        fs.readFile('./helpers/public/test.txt', function (err, buffer) {
            httpRequest('GET', '/test.txt', undefined, function (res, data) {
                expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8');
                expect(data).to.equal(buffer.toString());

                fs.readFile('./helpers/public/pixel.png', function (err, buffer) {
                    httpRequest('GET', '/pixel.png', undefined, function (res, data) {
                        expect(res.headers['content-type']).to.equal('image/png');
                        expect(data).to.equal(buffer.toString());
                        done();
                    });
                });
            });
        });
    });

    it('only considers GET requests', function (done) {
        app.post('/test1.txt', function (req, res) {
            res.end();
            done();
        });

        httpRequest('POST', '/test1.txt');
    });

    it('ignores routes without extension', function (done) {
        app.get('/test2', function (req, res) {
            res.end();
            done();
        });

        httpRequest('GET', '/test2');
    });

    it('ignores routes that include ".." string', function (done) {
        app.get('/../test3.txt', function (req, res) {
            res.end();
            done();
        });

        httpRequest('GET', '/../test3.txt');
    });

    it('continues to dynamic router if file not found', function (done) {
        app.get('/test4.txt', function (req, res) {
            res.end();
            done();
        });

        httpRequest('GET', '/test4.txt');
    });

    it('returns HTTP 500 status on file access error', function (done) {
        fs.chmod('./helpers/public/pixel.png', '222', function (err) {
            expect(err).to.equal(null);

            httpRequest('GET', '/pixel.png', undefined, function (res, data) {
                expect(res.statusCode).to.equal(500);
                expect(data.match(/(^\d+)/)[1]).to.equal('500');

                fs.chmod('./helpers/public/pixel.png', '644', function (err) {
                    expect(err).to.equal(null);
                    done();
                });
            });
        });
    });
});
