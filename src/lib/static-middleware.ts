/**
 * Middleware to serve static files.
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import { STATUS_CODES } from 'http';
import * as fs from 'fs';
import * as mime from 'mime-types';
import * as path from 'path';
import type { Request, Response } from './App';

const re1 = new RegExp(/\.[A-Za-z0-9]+$/);
const re2 = new RegExp(/\.\./);

type StaticMiddlewareOptions = {
  path?: string;
};

function make_static_middleware(opts: StaticMiddlewareOptions) {
  opts = opts || {};
  opts.path = opts.path || './public';

  function ok(
    err: NodeJS.ErrnoException | null,
    res: Response,
    next: () => void
  ) {
    if (!err) {
      return true;
    } else if (err.code === 'ENOENT') {
      next();
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end(`500 ${STATUS_CODES[500]}\n\n${err.message}`);
    }

    return false;
  }

  return function static_middleware(
    req: Request,
    res: Response,
    next: () => void
  ) {
    const url = req.url || '/';

    if (req.method === 'GET' && url.match(re1) && !url.match(re2)) {
      const file = opts.path + url;

      fs.access(
        file,
        fs.constants.R_OK,
        (err: NodeJS.ErrnoException | null) => {
          if (ok(err, res, next)) {
            fs.stat(file, (err: NodeJS.ErrnoException | null, stat) => {
              if (ok(err, res, next)) {
                const stream = fs.createReadStream(file);

                res.writeHead(200, {
                  'Content-Type': mime.contentType(path.extname(file)),
                  'Content-Length': stat.size,
                });

                stream.pipe(res);
              }
            });
          }
        }
      );
    } else {
      next();
    }
  };
}

export { make_static_middleware, StaticMiddlewareOptions };
