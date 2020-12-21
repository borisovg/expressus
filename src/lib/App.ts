/**
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import { IncomingMessage, STATUS_CODES, ServerResponse } from 'http';
import httpHash from 'http-hash';

interface ClientRequest extends IncomingMessage {
    params: RequestParams;
    splat: RequestSplat;
}

type MiddlewareCallbackFunction = () => void;
type MiddlewareFunction = (req: IncomingMessage, res: ServerResponse, next: MiddlewareCallbackFunction) => void;
type HandlerFunction = (req: ClientRequest, res: ServerResponse) => void;
type RequestParams = Record<string, any>;
type RequestSplat = string | null;
type RouteHandlerFunction = (req: ClientRequest, res: ServerResponse, params: RequestParams, splat: RequestSplat) => void;

function return_404 (res: ServerResponse) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`404 ${STATUS_CODES[404]}`);
}

function make_handler (callback: HandlerFunction): RouteHandlerFunction {
    return function handler (req: ClientRequest, res: ServerResponse, params: RequestParams, splat: RequestSplat) {
        req.params = params;
        req.splat = splat;
        callback(req, res);
    };
}

class App {
    private _middleware: MiddlewareFunction[];
    private _routes: Record<string, {
        get: (path: string) => {
            handler: RouteHandlerFunction,
            params: RequestParams,
            splat: RequestSplat;
        };
        set: (path: string, handler: RouteHandlerFunction) => void;
    }>;
    public router: (req: IncomingMessage, res: ServerResponse) => void;
    
    constructor () {
        this._middleware = [];
        this._routes = {
            DELETE: httpHash(),
            GET: httpHash(),
            PATCH: httpHash(),
            POST: httpHash(),
            PUT: httpHash(),
        };

        const route_request = (req: ClientRequest, res: ServerResponse) => {
            const method = req.method || '';
            const url = req.url || '';

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

        this.router = (req: IncomingMessage, res: ServerResponse) => {
            if (!this._middleware.length) {
                return route_request(req as ClientRequest, res);
            }

            const loop = (i: number) => {
                if (this._middleware[i]) {
                    this._middleware[i](req, res, function () {
                        loop(i + 1);
                    });

                } else {
                    route_request(req as ClientRequest, res);
                }
            };

            loop(0);
        };
    }

    delete (path: string, handler: HandlerFunction) {
        this._routes.DELETE.set(path, make_handler(handler));
    }

    get (path: string, handler: HandlerFunction) {
        this._routes.GET.set(path, make_handler(handler));
    }

    patch (path: string, handler: HandlerFunction) {
        this._routes.PATCH.set(path, make_handler(handler));
    }

    post (path: string, handler: HandlerFunction) {
        this._routes.POST.set(path, make_handler(handler));
    }

    put (path: string, handler: HandlerFunction) {
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

    use (fn: MiddlewareFunction) {
        this._middleware.push(fn);
    }
}

export { App };
