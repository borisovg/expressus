/**
 * Middleware to add CORS headers.
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2026
 * @license Apache-2.0
 */

import type { Request, Response } from "../types";

export type CorsMiddlewareOptions = {
  allowOrigin?: string;
  allowMethods?: string[];
  allowHeaders?: string[];
  allowCredentials?: boolean;
  maxAge?: number;
  varyOrigin?: boolean;
};

function make_cors_middleware({
  allowOrigin = "*",
  allowMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders = ["Content-Type", "Authorization"],
  allowCredentials,
  maxAge = 86400,
  varyOrigin,
}: CorsMiddlewareOptions = {}) {
  return function cors_middleware(
    req: Request,
    res: Response,
    next: () => void,
  ) {
    if (allowOrigin) {
      res.setHeader("Access-Control-Allow-Origin", allowOrigin);
    }
    if (allowMethods.length) {
      res.setHeader("Access-Control-Allow-Methods", allowMethods.join(", "));
    }
    if (allowHeaders.length) {
      res.setHeader("Access-Control-Allow-Headers", allowHeaders.join(", "));
    }
    if (allowCredentials && allowOrigin !== "*") {
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    if (maxAge) {
      res.setHeader("Access-Control-Max-Age", maxAge.toString());
    }
    if (varyOrigin) {
      res.setHeader("Vary", "Origin");
    }

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    next();
  };
}

export { make_cors_middleware };
