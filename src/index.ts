/**
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

import { body_middleware } from './lib/body-middleware';
import { form_middleware } from './lib/form-middleware';
import { json_middleware } from './lib/json-middleware';
import { query_middleware } from './lib/query-middleware';
import { make_static_middleware } from './lib/static-middleware';
import type { StaticMiddlewareOptions } from './lib/static-middleware';

export { App } from './lib/App';
export type { Request, Response } from './lib/App';
export type { RequestWithBody } from './lib/body-middleware';
export type { RequestWithForm } from './lib/form-middleware';
export type { RequestWithJson, ResponseWithJson } from './lib/json-middleware';
export type { RequestWithQuery } from './lib/query-middleware';

export const middleware = {
    body: () => body_middleware,
    form: () => form_middleware,
    json: () => json_middleware,
    query: () => query_middleware,

    static(opts: StaticMiddlewareOptions) {
        return make_static_middleware(opts);
    },
};
