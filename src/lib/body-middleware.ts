'use strict';
/**
 * Middleware to load request body, which then is attached to `req.body` as a buffer.
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import { IncomingMessage, ServerResponse } from 'http';

interface ClientRequest extends IncomingMessage {
    body: Buffer;
}

function body_middleware(req: IncomingMessage, _res: ServerResponse, next: () => void) {
    const chunks: Buffer[] = [];

    req.on('data', function (buffer) {
        chunks.push(buffer);
    });

    const req2 = req as ClientRequest;

    req.on('end', function () {
        if (chunks.length) {
            req2.body = Buffer.concat(chunks);
        }

        next();
    });
}

export { body_middleware };
