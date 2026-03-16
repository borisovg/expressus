/**
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license Apache-2.0
 */

import { body_middleware } from "./lib/body-middleware";
import {
  type CorsMiddlewareOptions,
  make_cors_middleware,
} from "./lib/cors-middleware";
import { form_middleware } from "./lib/form-middleware";
import { json_middleware } from "./lib/json-middleware";
import { query_middleware } from "./lib/query-middleware";
import {
  make_static_middleware,
  type StaticMiddlewareOptions,
} from "./lib/static-middleware";

export { App } from "./App";
export type { BodyRequest } from "./lib/body-middleware";
export type { FormRequest } from "./lib/form-middleware";
export { get_body } from "./lib/get-body";
export type { JsonRequest, JsonResponse } from "./lib/json-middleware";
export type { QueryRequest } from "./lib/query-middleware";
export type {
  HandlerFunction,
  MiddlewareFunction,
  Request,
  Response,
} from "./types";

export const middleware = {
  body: () => body_middleware,
  form: () => form_middleware,
  json: () => json_middleware,
  query: () => query_middleware,

  cors: (opts: CorsMiddlewareOptions = {}) => make_cors_middleware(opts),
  static: (opts: StaticMiddlewareOptions = {}) => make_static_middleware(opts),
};
