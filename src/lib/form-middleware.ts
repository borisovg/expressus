/**
 * Middleware will parse `req.body` as form data, replacing it with the result.
 * It also binds a `res.json()` convenience method to send JSON response to the client.
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import { STATUS_CODES } from 'http';
import type { Request, Response } from './App';
import type { RequestWithBody } from './body-middleware';

export type RequestWithForm = Request & {
  body: Record<string, string>;
};

const formType = 'application/x-www-form-urlencoded';

function form_middleware(
  req: RequestWithBody,
  res: Response,
  next: () => void
) {
  if (req.body && req.headers['content-type'] === formType) {
    const list = req.body.toString().split('&');
    const req2 = req as unknown as RequestWithForm;

    req2.body = {};

    for (let i = 0; i < list.length; i += 1) {
      const a = list[i].split('=');

      if (a.length !== 2) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(`400 ${STATUS_CODES[400]}`);
      }

      req2.body[decodeURIComponent(a[0])] = decodeURIComponent(a[1]);
    }
  }

  next();
}

export { form_middleware };
