/**
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license Apache-2.0
 */

import {
  type IncomingMessage,
  type ServerResponse,
  STATUS_CODES,
} from "node:http";
import type {
  HandlerFunction,
  MiddlewareFunction,
  Request,
  Response,
} from "./types";

import httpHash = require("http-hash");

type Methods = "DELETE" | "GET" | "OPTIONS" | "PATCH" | "POST" | "PUT";
type AppRequest<ReqMiddleware extends object> = Request<string> & ReqMiddleware;
type AppResponse<ResMiddleware extends object> = Response & ResMiddleware;
type InternalHandler<
  ReqMiddleware extends object,
  ResMiddleware extends object,
> = HandlerFunction<
  AppRequest<ReqMiddleware>,
  AppResponse<ResMiddleware>,
  string
>;
type InternalMiddleware = MiddlewareFunction<Request, Response>;

function return_404(res: ServerResponse) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(`404 ${STATUS_CODES[404]}`);
}

export class App<
  ReqMiddleware extends object = object,
  ResMiddleware extends object = object,
> {
  private middlewares: InternalMiddleware[];
  private routes: Record<
    Methods,
    ReturnType<typeof httpHash<InternalHandler<ReqMiddleware, ResMiddleware>>>
  >;
  public router: (req: IncomingMessage, res: ServerResponse) => void;

  constructor() {
    this.middlewares = [];
    this.routes = {
      DELETE: httpHash<InternalHandler<ReqMiddleware, ResMiddleware>>(),
      GET: httpHash<InternalHandler<ReqMiddleware, ResMiddleware>>(),
      OPTIONS: httpHash<InternalHandler<ReqMiddleware, ResMiddleware>>(),
      PATCH: httpHash<InternalHandler<ReqMiddleware, ResMiddleware>>(),
      POST: httpHash<InternalHandler<ReqMiddleware, ResMiddleware>>(),
      PUT: httpHash<InternalHandler<ReqMiddleware, ResMiddleware>>(),
    };

    this.router = (req: IncomingMessage, res: ServerResponse) => {
      const method = req.method as Methods;

      const loop = (i: number) => {
        const req2 = req as AppRequest<ReqMiddleware>;
        const res2 = res as AppResponse<ResMiddleware>;
        const mw = this.middlewares[i];

        if (mw) {
          return mw(req2, res2, () => {
            loop(i + 1);
          });
        }

        const url = (req.url as string).split(/[#?]/).shift() as string;
        const route = this.routes[method]?.get(url);

        if (route?.handler) {
          req2.params = route.params;
          req2.route = route.src;
          req2.splat = route.splat;
          route.handler(req2, res2);
        } else {
          return_404(res);
        }
      };

      loop(0);
    };
  }

  private register<Path extends string>(
    method: Methods,
    path: Path,
    handler: HandlerFunction<
      Request<Path> & ReqMiddleware,
      Response & ResMiddleware,
      Path
    >,
  ) {
    this.routes[method].set(
      path,
      handler as InternalHandler<ReqMiddleware, ResMiddleware>,
    );
  }

  delete<Path extends string>(
    path: Path,
    handler: HandlerFunction<
      Request<Path> & ReqMiddleware,
      Response & ResMiddleware,
      Path
    >,
  ) {
    this.register("DELETE", path, handler);
  }

  get<Path extends string>(
    path: Path,
    handler: HandlerFunction<
      Request<Path> & ReqMiddleware,
      Response & ResMiddleware,
      Path
    >,
  ) {
    this.register("GET", path, handler);
  }

  options<Path extends string>(
    path: Path,
    handler: HandlerFunction<
      Request<Path> & ReqMiddleware,
      Response & ResMiddleware,
      Path
    >,
  ) {
    this.register("OPTIONS", path, handler);
  }

  patch<Path extends string>(
    path: Path,
    handler: HandlerFunction<
      Request<Path> & ReqMiddleware,
      Response & ResMiddleware,
      Path
    >,
  ) {
    this.register("PATCH", path, handler);
  }

  post<Path extends string>(
    path: Path,
    handler: HandlerFunction<
      Request<Path> & ReqMiddleware,
      Response & ResMiddleware,
      Path
    >,
  ) {
    this.register("POST", path, handler);
  }

  put<Path extends string>(
    path: Path,
    handler: HandlerFunction<
      Request<Path> & ReqMiddleware,
      Response & ResMiddleware,
      Path
    >,
  ) {
    this.register("PUT", path, handler);
  }

  remove_all_handlers() {
    for (const method of Object.keys(this.routes)) {
      this.routes[method as Methods] =
        httpHash<InternalHandler<ReqMiddleware, ResMiddleware>>();
    }
  }

  remove_middleware(fn?: InternalMiddleware) {
    if (fn) {
      const idx = this.middlewares.indexOf(fn);

      if (idx > -1) {
        this.middlewares.splice(idx, 1);
      }
    } else {
      this.middlewares = [];
    }
  }

  use<TReq extends Request = Request, TRes extends Response = Response>(
    fn: MiddlewareFunction<TReq, TRes>,
  ) {
    this.middlewares.push(fn as InternalMiddleware);
  }
}
