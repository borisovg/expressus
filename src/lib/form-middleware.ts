/**
 * Middleware will parse `req.body` as form data, replacing it with the result.
 * It also binds a `res.json()` convenience method to send JSON response to the client.
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import { STATUS_CODES } from 'http';
import type { Request, Response } from '../types';
import { get_body } from './get-body';

export type RequestWithForm<Path = string> = Request<Path> & FormRequest;

export type FormRequest = {
  body?: Record<string, string>;
};

const formType = 'application/x-www-form-urlencoded';

function form_middleware(
  req: RequestWithForm,
  res: Response,
  next: () => void
) {
  const { method } = req;

  if (
    method === 'GET' ||
    method === 'DELETE' ||
    method === 'HEAD' ||
    method === 'OPTIONS' ||
    method === 'TRACE' ||
    req.headers['content-type'] !== formType
  ) {
    return next();
  }

  get_body(req)
    .then((body) => {
      if (!body.length) {
        return next();
      }

      const list = body.toString().split('&');

      req.body = {};

      for (let i = 0; i < list.length; i += 1) {
        const a = list[i].split('=');

        if (a.length !== 2) {
          throw new Error();
        }

        req.body[decodeURIComponent(a[0])] = decodeURIComponent(a[1]);
      }

      next();
    })
    .catch((_err) => {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(Buffer.from(`400 ${STATUS_CODES[400]}`));
    });
}

export { form_middleware };
