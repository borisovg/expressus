/**
 * Middleware to load request body, which then is attached to `req.body` as a buffer.
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import { STATUS_CODES } from 'http';
import type { Request, Response } from '../types';
import { get_body } from './get-body';

export type RequestWithBody<Path = string> = Request<Path> & BodyRequest;

export type BodyRequest = {
  body?: Buffer;
};

export function body_middleware(
  req: RequestWithBody,
  res: Response,
  next: () => void,
) {
  const { method } = req;

  if (
    method === 'GET' ||
    method === 'DELETE' ||
    method === 'HEAD' ||
    method === 'OPTIONS' ||
    method === 'TRACE' ||
    req.headers?.['content-type']?.includes('application/json')
  ) {
    return next();
  }

  get_body(req)
    .then((body) => {
      if (body.length) {
        req.body = body;
      }

      next();
    })
    .catch((err) => {
      res.statusCode = 400;
      res.end(Buffer.from(`400 ${STATUS_CODES[400]} (${err.message})`));
    });
}
