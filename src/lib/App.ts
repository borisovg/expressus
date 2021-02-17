/**
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import { IncomingMessage, STATUS_CODES, ServerResponse } from 'http';
import httpHash from 'http-hash';

type Request<T> = T & IncomingMessage & {
    method: string;
    params: RequestParams;
    splat: RequestSplat;
}

type Response<T> = T & ServerResponse;

type MiddlewareCallbackFunction = () => void;
type MiddlewareFunction<T1, T2> = (req: Request<T1>, Response: T2, next: MiddlewareCallbackFunction) => Promise<void> | void;
type HandlerFunction<T1, T2> = (req: Request<T1>, res: T2) => Promise<void> | void;
type RequestParams = Record<string, string>;
type RequestSplat = string | null;
type RouteHandlerFunction<T1, T2> = (req: Request<T1>, res: T2, params: RequestParams, splat: RequestSplat) => Promise<void> | void;

function return_404 (res: ServerResponse) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`404 ${STATUS_CODES[404]}`);
}

function make_handler<T1, T2> (callback: HandlerFunction<T1, T2>): RouteHandlerFunction<T1, T2> {
    return function handler (req: Request<T1>, res: T2, params: RequestParams, splat: RequestSplat) {
        req.params = params;
        req.splat = splat;
        return callback(req, res);
    };
}

class App {
    private _middleware: any[];
    private _routes: Record<string, {
        get<T1, T2> (path: string): {
            handler: RouteHandlerFunction<T1, T2>,
            params: RequestParams,
            splat: RequestSplat;
        };
        set<T1, T2> (path: string, handler: RouteHandlerFunction<T1, T2>): void;
    }>;
    public router: (req: IncomingMessage, res: ServerResponse) => void;
    
    constructor () {
        this._middleware = [];
        this._routes = {
            DELETE: httpHash(),
            GET: httpHash(),
            OPTIONS: httpHash(),
            PATCH: httpHash(),
            POST: httpHash(),
            PUT: httpHash(),
        };

        const route_request = <T1, T2> (req: Request<T1>, res: Response<T2>) => {
            const method = req.method as string;
            const url = req.url as string;

            if (this._routes[method]) {
                const r = this._routes[method].get(url);

                if (r.handler) {
                    r.handler(req, res, r.params, r.splat);
                } else {
                    return_404(res);
                }

            } else {
                return_404(res);
            }
        };

        this.router = (req, res) => {
            const req2 = req as Request<IncomingMessage>;
            const res2 = res as Response<ServerResponse>;

            if (!this._middleware.length) {
                return route_request(req2, res);
            }

            const loop = (i: number) => {
                if (this._middleware[i]) {
                    this._middleware[i](req2, res2, function () {
                        loop(i + 1);
                    });

                } else {
                    route_request(req2, res2);
                }
            };

            loop(0);
        };
    }

    delete<T1, T2> (path: string, handler: HandlerFunction<T1, T2>) {
        this._routes.DELETE.set(path, make_handler(handler));
    }

    get<T1, T2> (path: string, handler: HandlerFunction<T1, T2>) {
        this._routes.GET.set(path, make_handler(handler));
    }

    options<T1, T2>(path: string, handler: HandlerFunction<T1, T2>) {
        this._routes.OPTIONS.set(path, make_handler(handler));
    }

    patch<T1, T2> (path: string, handler: HandlerFunction<T1, T2>) {
        this._routes.PATCH.set(path, make_handler(handler));
    }

    post<T1, T2> (path: string, handler: HandlerFunction<T1, T2>) {
        this._routes.POST.set(path, make_handler(handler));
    }

    put<T1, T2> (path: string, handler: HandlerFunction<T1, T2>) {
        this._routes.PUT.set(path, make_handler(handler));
    }

    remove_all_handlers () {
        for (const method in this._routes) {
            // istanbul ignore else
            if (this._routes.hasOwnProperty(method)) {
                this._routes[method] = httpHash();
            }
        }
    }

    use<T1, T2> (fn: MiddlewareFunction<T1, T2>) {
        this._middleware.push(fn);
    }
}

export { App, Request, Response };
