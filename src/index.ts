/**
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import { App, Request, Response } from './lib/App';
import { body_middleware } from './lib/body-middleware';
import { form_middleware } from './lib/form-middleware';
import { json_middleware } from './lib/json-middleware';
import { query_middleware } from './lib/query-middleware';
import { make_static_middleware, StaticMiddlewareOptions } from './lib/static-middleware';

const middleware = {
    body: () => body_middleware,
    form: () => form_middleware,
    json: () => json_middleware,
    query: () => query_middleware,

    static(opts: StaticMiddlewareOptions) {
        return make_static_middleware(opts);
    },
};

export { App, middleware, Request, Response };
