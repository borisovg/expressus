/**
 * Middleware to serve static files.
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license Apache-2.0
 */

import { access, constants, createReadStream, stat } from "node:fs";
import { STATUS_CODES } from "node:http";
import * as path from "node:path";
import { contentType } from "mime-types";
import type { Request, Response } from "../types";

const re1 = new RegExp(/\.[A-Za-z0-9]+$/);
const re2 = new RegExp(/\.\./);

type StaticMiddlewareOptions = {
  path?: string;
};

function make_static_middleware({
  path: dirPath = "./public",
}: StaticMiddlewareOptions = {}) {
  function ok(
    err: NodeJS.ErrnoException | null,
    res: Response,
    next: () => void,
  ) {
    if (!err) {
      return true;
    } else if (err.code === "ENOENT") {
      next();
    } else {
      res.writeHead(500, { "Content-Type": "text/plain; charset=UTF-8" });
      res.end(`500 ${STATUS_CODES[500]}\n\n${err.message}`);
    }

    return false;
  }

  return function static_middleware(
    req: Request,
    res: Response,
    next: () => void,
  ) {
    const url = req.url || "/";

    if (req.method !== "GET" || !url.match(re1) || url.match(re2)) {
      return next();
    }

    const file = dirPath + url;

    access(file, constants.R_OK, (err: NodeJS.ErrnoException | null) => {
      if (!ok(err, res, next)) {
        return;
      }

      stat(file, (err: NodeJS.ErrnoException | null, stat) => {
        if (!ok(err, res, next)) {
          return;
        }

        const stream = createReadStream(file);
        const type = contentType(path.extname(file));

        res.writeHead(200, {
          "Content-Type": type || "application/octet-stream",
          "Content-Length": stat.size,
        });

        stream.pipe(res);
      });
    });
  };
}

export { make_static_middleware, type StaticMiddlewareOptions };
