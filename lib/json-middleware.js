'use strict';

/**
 * Middleware will parse `req.body` as JSON, replacing it with the result.
 * If parsing fails, a 400 response will be returned to the client.
 * It also binds a `res.json()` convenience method to send JSON response to the client.
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

const http = require('http');
const jsonType = 'application/json';

module.exports = function json_middleware (req, res, next) {
    if (req.body && req.headers['content-type'] === jsonType) {
        try {
            req.body = JSON.parse(req.body);
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end(`400 ${http.STATUS_CODES[400]}\n\n${e.message}`);
        }
    }

    res.json = function (data) {
        res.setHeader('Content-Type', jsonType);
        res.end(JSON.stringify(data));
    };

    next();
};
