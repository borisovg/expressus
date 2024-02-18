/**
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import { IncomingMessage, STATUS_CODES, ServerResponse } from 'http';
import type {
  HandlerFunction,
  MiddlewareFunction,
  Request,
  Response,
} from './types';
import httpHash = require('http-hash');

type Methods = 'DELETE' | 'GET' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT';

function return_404(res: ServerResponse) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`404 ${STATUS_CODES[404]}`);
}

export class App<ReqMiddleware = {}, ResMiddleware = {}> {
  private middlewares: MiddlewareFunction<any, any>[];
  private routes: Record<
    Methods,
    ReturnType<typeof httpHash<HandlerFunction<any, any, any>>>
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

    this.router = (req: IncomingMessage, res: ServerResponse) => {
      const method = req.method as Methods;

      const loop = (i: number) => {
        const mw = this.middlewares[i];

        if (mw) {
          return mw(req, res, function () {
            loop(i + 1);
          });
        }

        const url = (req.url as string).split(/[#?]/).shift() as string;
        const route = this.routes[method]?.get(url);

        if (route?.handler) {
          (req as Request).params = route.params;
          (req as Request).route = route.src;
          (req as Request).splat = route.splat;
          route.handler(req, res);
        } else {
          return_404(res);
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
    this.routes.DELETE.set(path, handler);
  }

  get<
    T1 extends Request<Path> & ReqMiddleware,
    T2 extends Response & ResMiddleware,
    Path extends string,
  >(path: Path, handler: HandlerFunction<T1, T2, Path>) {
    this.routes.GET.set(path, handler);
  }

  options<
    T1 extends Request<Path> & ReqMiddleware,
    T2 extends Response & ResMiddleware,
    Path extends string,
  >(path: Path, handler: HandlerFunction<T1, T2, Path>) {
    this.routes.OPTIONS.set(path, handler);
  }

  patch<
    T1 extends Request<Path> & ReqMiddleware,
    T2 extends Response & ResMiddleware,
    Path extends string,
  >(path: Path, handler: HandlerFunction<T1, T2, Path>) {
    this.routes.PATCH.set(path, handler);
  }

  post<
    T1 extends Request<Path> & ReqMiddleware,
    T2 extends Response & ResMiddleware,
    Path extends string,
  >(path: Path, handler: HandlerFunction<T1, T2, Path>) {
    this.routes.POST.set(path, handler);
  }

  put<
    T1 extends Request<Path> & ReqMiddleware,
    T2 extends Response & ResMiddleware,
    Path extends string,
  >(path: Path, handler: HandlerFunction<T1, T2, Path>) {
    this.routes.PUT.set(path, handler);
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
