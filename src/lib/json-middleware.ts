/**
 * Middleware will parse `req.body` as JSON, replacing it with the result.
 * If parsing fails, a 400 response will be returned to the client.
 * It also binds a `res.json()` convenience method to send JSON response to the client.
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import { STATUS_CODES } from 'http';
import type { Request, Response } from './App';
import type { RequestWithBody } from './body-middleware';

export type RequestWithJson = Request & {
    body?: unknown;
};

export type ResponseWithJson = Response & {
    json: (data: unknown) => void;
};

const jsonType = 'application/json';
const jsonTypeRe = new RegExp(jsonType + '(;s?charset=.+)?$');

export function json_middleware(req: RequestWithBody, res: ResponseWithJson, next: () => void) {
    if (req.body && jsonTypeRe.exec(req.headers['content-type'] || '')) {
        const req2 = req as RequestWithJson;

        try {
            req2.body = JSON.parse(req.body.toString());
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end(`400 ${STATUS_CODES[400]}\n\n${e.message}`);
        }
    }

    res.json = (data) => {
        res.setHeader('Content-Type', jsonType);
        res.end(JSON.stringify(data));
    };

    next();
}
