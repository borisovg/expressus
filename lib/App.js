'use strict';

/**
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

const http = require('http');
const httpHash = require('http-hash');

function return_404 (res) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`404 ${http.STATUS_CODES[404]}`);
}

function make_handler (callback) {
    return function handler (req, res, params, splat) {
        req.params = params;
        req.splat = splat;
        callback(req, res);
    };
}

class App {
    constructor () {
        this._middleware = [];
        this._router = {
            DELETE: httpHash(),
            GET: httpHash(),
            POST: httpHash(),
            PUT: httpHash(),
        };

        const route_request = (req, res) => {
            if (this._router[req.method]) {
                const r = this._router[req.method].get(req.url);

                if (r.handler) {
                    r.handler(req, res, r.params, r.splat);
                } else {
                    return_404(res);
                }

            } else {
                return_404(res);
            }
        };

        this.router = (req, res) => {
            if (!this._middleware.length) {
                return route_request(req, res);
            }

            const loop = (i) => {
                if (this._middleware[i]) {
                    this._middleware[i](req, res, function () {
                        loop(i + 1);
                    });

                } else {
                    route_request(req, res);
                }
            };

            loop(0);
        };
    }

    delete (path, handler) {
        this._router.DELETE.set(path, make_handler(handler));
    }

    get (path, handler) {
        this._router.GET.set(path, make_handler(handler));
    }

    post (path, handler) {
        this._router.POST.set(path, make_handler(handler));
    }

    put (path, handler) {
        this._router.PUT.set(path, make_handler(handler));
    }

    remove_all_handlers () {
        for (let method in this._router) {
            // istanbul ignore else
            if (this._router.hasOwnProperty(method)) {
                this._router[method] = httpHash();
            }
        }
    }

    use (fn) {
        this._middleware.push(fn);
    }
}

module.exports = App;
