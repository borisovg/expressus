/**
 * Middleware to parse request query string, which then is attached to `req.query` as an object.
 * It replaces `req.url` with the plain request path (with query part removed).
 * Original request URL is preserved at `req.originalUrl`.
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import { URL } from 'url';
import type { Request, Response } from '../types';

export type RequestWithQuery<Path = string> = Request<Path> & QueryRequest;

export type QueryRequest = {
  originalUrl?: string;
  query: Record<string, string>;
  url: string;
};

export function query_middleware(
  req: RequestWithQuery,
  _res: Response,
  next: () => void
) {
  const u = new URL(req.url || '', `http://${req.headers.host}`);

  req.originalUrl = req.url;
  req.url = u.pathname;
  req.query = {};

  for (const [k, v] of u.searchParams.entries()) {
    req.query[k] = v;
  }

  next();
}
