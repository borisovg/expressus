/**
 * Middleware will parse `req.body` as JSON, replacing it with the result.
 * If parsing fails, a 400 response will be returned to the client.
 * It also binds a `res.json()` convenience method to send JSON response to the client.
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import { STATUS_CODES } from 'http';
import type { Request, Response } from '../App';
import { get_body } from './get-body';

export type RequestWithJson = Request & {
  body?: unknown;
};

export type ResponseWithJson = Response & {
  json: (data: unknown) => void;
};

const jsonType = 'application/json';

export function json_middleware(
  req: RequestWithJson,
  res: ResponseWithJson,
  next: () => void
) {
  const { method } = req;

  if (
    method === 'GET' ||
    method === 'DELETE' ||
    method === 'HEAD' ||
    method === 'OPTIONS' ||
    method === 'TRACE' ||
    !req.headers['content-type']?.includes(jsonType)
  ) {
    return next();
  }

  res.json = (data) => {
    res.setHeader('Content-Type', jsonType);
    res.end(JSON.stringify(data));
  };

  get_body(req)
    .then((body) => {
      if (body.length) {
        req.body = JSON.parse(body.toString());
      }
      next();
    })
    .catch((err) => {
      res.statusCode = 400;
      res.json({
        code: 400,
        message: STATUS_CODES[400],
        error: { message: (err as Error).message },
      });
    });
}
