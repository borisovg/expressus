'use strict';

/**
 * Middleware to parse request query string, which then is attached to `req.query` as an object.
 * It replaces `req.url` with the plain request path (with query part removed).
 * Original request URL is preserved at `req.originalUrl`.
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import { IncomingMessage, ServerResponse } from 'http'
import { ParsedUrlQuery } from 'querystring';
import { parse } from 'url';

interface ClientRequestWithQuery extends IncomingMessage {
    originalUrl?: string,
    query: ParsedUrlQuery
    url?: string;
}

function query_middleware (req: IncomingMessage, _res: ServerResponse, next: () => void) {
    const req2 = (req as ClientRequestWithQuery);
    const u = parse((req.url || ''), true);

    req2.originalUrl = req.url;
    req2.query = u.query;
    req2.url = u.pathname || undefined,

    next();
};

export { query_middleware };
