/**
 * Middleware to load request body, which then is attached to `req.body` as a buffer.
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import type { Request, Response } from './App';

export type RequestWithBody = Request & {
  body?: Buffer;
};

export function body_middleware(
  req: RequestWithBody,
  _res: Response,
  next: () => void
) {
  const chunks: Buffer[] = [];

  req.on('data', function (buffer) {
    chunks.push(buffer);
  });

  req.on('end', function () {
    if (chunks.length) {
      req.body = Buffer.concat(chunks);
    }

    next();
  });
}
