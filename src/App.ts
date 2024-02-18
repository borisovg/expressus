/**
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import { IncomingMessage, STATUS_CODES, ServerResponse } from 'http';
import type { Request, Response } from './types';
import httpHash = require('http-hash');

type MiddlewareFunction<T1 extends Request, T2 extends Response> = (
  req: T1,
  Response: T2,
  next: () => void
) => Promise<void> | void;
type HandlerFunction<T1 extends Request<Path>, T2 extends Response, Path> = (
  req: T1,
  res: T2
) => Promise<void> | void;
type RouteHandlerFunction<
  T1 extends Request<Path>,
  T2 extends Response,
  Path,
> = (
  req: T1,
  res: T2,
  params: Request<Path>['params'],
  splat: Request<Path>['splat'],
) => Promise<void> | void;

type Methods = 'DELETE' | 'GET' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT';

function return_404(res: ServerResponse) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`404 ${STATUS_CODES[404]}`);
}

function make_handler<T1 extends Request<Path>, T2 extends Response, Path>(
  callback: HandlerFunction<T1, T2, Path>,
): RouteHandlerFunction<T1, T2, Path> {
  return function handler(
    req: T1,
    res: T2,
    params: Request<Path>['params'],
    splat: Request<Path>['splat'],
  ) {
    req.params = params;
    req.splat = splat;
    return callback(req, res);
  };
}

export class App<ReqMiddleware = {}, ResMiddleware = {}> {
  private middlewares: MiddlewareFunction<any, any>[];
  private routes: Record<
    Methods,
    ReturnType<typeof httpHash<RouteHandlerFunction<any, any, any>>>
  >;
  public router: (req: IncomingMessage, res: ServerResponse) => void;

  constructor() {
    this.middlewares = [];
    this.routes = {
      DELETE: httpHash(),
      GET: httpHash(),
      OPTIONS: httpHash(),
      PATCH: httpHash(),
      POST: httpHash(),
      PUT: httpHash(),
    };

    const route_request = (req: IncomingMessage, res: ServerResponse) => {
      const method = req.method as Methods;
      const url = req.url as string;
      const route = this.routes[method];

      if (route) {
        const r = route.get(url);

        if (r.handler) {
          r.handler(req, res, r.params, r.splat);
        } else {
          return_404(res);
        }
      } else {
        return_404(res);
      }
    };

    this.router = (req: IncomingMessage, res: ServerResponse) => {
      if (!this.middlewares.length) {
        return route_request(req, res);
      }

      const loop = (i: number) => {
        const mw = this.middlewares[i];

        if (mw) {
          mw(req, res, function () {
            loop(i + 1);
          });
        } else {
          route_request(req, res);
        }
      };

      loop(0);
    };
  }

  delete<
    T1 extends Request<Path> & ReqMiddleware,
    T2 extends Response & ResMiddleware,
    Path extends string,
  >(path: Path, handler: HandlerFunction<T1, T2, Path>) {
    this.routes.DELETE.set(path, make_handler(handler));
  }

  get<
    T1 extends Request<Path> & ReqMiddleware,
    T2 extends Response & ResMiddleware,
    Path extends string,
  >(path: Path, handler: HandlerFunction<T1, T2, Path>) {
    this.routes.GET.set(path, make_handler(handler));
  }

  options<
    T1 extends Request<Path> & ReqMiddleware,
    T2 extends Response & ResMiddleware,
    Path extends string,
  >(path: Path, handler: HandlerFunction<T1, T2, Path>) {
    this.routes.OPTIONS.set(path, make_handler(handler));
  }

  patch<
    T1 extends Request<Path> & ReqMiddleware,
    T2 extends Response & ResMiddleware,
    Path extends string,
  >(path: Path, handler: HandlerFunction<T1, T2, Path>) {
    this.routes.PATCH.set(path, make_handler(handler));
  }

  post<
    T1 extends Request<Path> & ReqMiddleware,
    T2 extends Response & ResMiddleware,
    Path extends string,
  >(path: Path, handler: HandlerFunction<T1, T2, Path>) {
    this.routes.POST.set(path, make_handler(handler));
  }

  put<
    T1 extends Request<Path> & ReqMiddleware,
    T2 extends Response & ResMiddleware,
    Path extends string,
  >(path: Path, handler: HandlerFunction<T1, T2, Path>) {
    this.routes.PUT.set(path, make_handler(handler));
  }

  remove_all_handlers() {
    Object.keys(this.routes).forEach((method) => {
      this.routes[method as Methods] = httpHash();
    });
  }

  remove_middleware(fn?: MiddlewareFunction<any, any>) {
    if (fn) {
      const idx = this.middlewares.indexOf(fn);

      if (idx > -1) {
        this.middlewares.splice(idx, 1);
      }
    } else {
      this.middlewares = [];
    }
  }

  use<T1 extends Request, T2 extends Response>(fn: MiddlewareFunction<T1, T2>) {
    this.middlewares.push(fn);
  }
}
