'use strict';

/**
 * Middleware to parse request query string, which then is attached to `req.query` as an object.
 * It replaces `req.url` with the plain request path (with query part removed).
 * Original request URL is preserved at `req.originalUrl`.
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

const url = require('url');

module.exports = function query_middleware (req, res, next) {
    const u = url.parse(req.url, true);

    req.originalUrl = req.url;
    req.query = u.query;
    req.url = u.pathname;

    next();
};
