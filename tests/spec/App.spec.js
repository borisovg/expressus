/**
 * @author George Borisov <git@gir.me.uk>
 */
'use strict';

const expect = require('chai').expect;
const http = require('http');

const client = require('../helpers/http-client.js');
const lib = require('../..');

describe('lib/App.js', () => {
    const port = 10001;
    const httpRequest = client(port);
    const path = '/test/foofoo/bar/baz';
    let app, server;

    after((done) => server.close(done));

    it('creates HTTP server when called with no options', () => {
        app = new lib.App();
    });

    it('exposes request handler as app.router', (done) => {
        expect(typeof app.router).to.equal('function');
        server = http.createServer(app.router);
        server.listen(port, done);
    });

    ['delete', 'get', 'options', 'patch', 'post', 'put'].forEach((k) => {
        const m = k.toUpperCase();

        it(`registers ${m} handler`, (done) => {
            app[k]('/test/:foo/*', (req, res) => {
                expect(req.method).to.equal(m);
                expect(req.url).to.equal(path);
                expect(req.params.foo).to.equal('foofoo');
                expect(req.splat).to.equal('bar/baz');

                req.on('data', (buffer) => {
                    expect(buffer.toString()).to.equal('bar');
                });

                res.end('foo');
            });

            httpRequest({ method: m, path }, 'bar', (res, data) => {
                expect(res.statusCode).to.equal(200);
                expect(data).to.equal('foo');
                done();
            });
        });
    });

    it('registers middleware and applies it to request', (done) => {
        let semaphore = 2;

        function mw(req, res, next) {
            expect(req.url).to.equal(path);
            expect(typeof res.end).to.equal('function');
            expect(typeof next).to.equal('function');

            semaphore -= 1;
            next();
        }

        for (let i = 0; i < 2; i += 1) {
            app.use(mw);
        }

        expect(app._middleware.length).to.equal(2);

        httpRequest({ method: 'GET', path }, undefined, (res, data) => {
            expect(res.statusCode).to.equal(200);
            expect(data).to.equal('foo');
            expect(semaphore).to.equal(0);

            app._middleware = [];
            done();
        });
    });

    it('returns 404 in strange method', (done) => {
        httpRequest({ method: 'ACL', path }, undefined, (res, data) => {
            expect(res.statusCode).to.equal(404);
            expect(typeof data).to.equal('string');
            done();
        });
    });

    it('returns 404 in unknown route', (done) => {
        httpRequest({ method: 'GET', path: '/spanner' }, undefined, (res, data) => {
            expect(res.statusCode).to.equal(404);
            expect(typeof data).to.equal('string');
            done();
        });
    });

    it('removes all handlers', (done) => {
        app.remove_all_handlers();

        httpRequest({ method: 'GET', path }, undefined, (res) => {
            expect(res.statusCode).to.equal(404);
            done();
        });
    });

    it('remove_middleware() idempotently removes middleware', (done) => {
        let counter = 0;

        function mw(req, res, next) {
            counter += 1;
            next();
        }

        app.use(mw);

        httpRequest({ method: 'GET', path }, undefined, () => {
            expect(counter).to.equal(1);

            app.remove_middleware(mw);

            httpRequest({ method: 'GET', path }, undefined, () => {
                expect(counter).to.equal(1);
                app.remove_middleware(mw);
                done();
            });
        });
    });
});
