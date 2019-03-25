'use strict';

/**
* Middleware to serve static files.
* @author George Borisov <git@gir.me.uk>
* @copyright George Borisov 2018
* @license LGPL-3.0
*/

const fs = require('fs');
const http = require('http');
const mime = require('mime-types');
const path = require('path');

const re1 = new RegExp(/\.[A-Za-z0-9]+$/);
const re2 = new RegExp(/\.\./);

module.exports = function make_middleware (opts) {
    opts = opts || {};
    opts.path = opts.path || './public';

    function ok (err, res, next) {
        if (!err) {
            return true;

        } else if (err.code === 'ENOENT') {
            next();

        } else {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
            res.end(`500 ${http.STATUS_CODES[500]}\n\n${err.message}`);
        }

        return false;
    }

    return function static_middleware (req, res, next) {
        if (req.method === 'GET' && req.url.match(re1) && !req.url.match(re2)) {
            const file = opts.path + req.url;

            fs.access(file, fs.R_OK, function (err) {
                if (ok(err, res, next)) {
                    fs.stat(file, function (err, stat) {
                        if (ok(err, res, next)) {
                            const stream = fs.createReadStream(file);

                            res.writeHead(200, {
                                'Content-Type': mime.contentType(path.extname(file)),
                                'Content-Length': stat.size,
                            });

                            stream.pipe(res);
                        }
                    });
                }
            });

        } else {
            next();
        }
    };
};
