'use strict';

/**
 * Middleware to load request body, which then is attached to `req.body` as a buffer.
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

module.exports = function body_middleware (req, res, next) {
    const chunks = [];

    req.on('data', function (buffer) {
        chunks.push(buffer);
    });

    req.on('end', function () {
        if (chunks.length) {
            req.body = Buffer.concat(chunks);
        }

        next();
    });
};
