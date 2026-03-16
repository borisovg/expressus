/**
 * @author George Borisov <git@gir.me.uk>
 */

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Request } from "..";
import { App, middleware } from "..";
import { makeAsyncClient } from "../test-helpers/http-client";
import { createHttpServer, type TestServer } from "../test-helpers/http-server";
import type { CorsMiddlewareOptions } from "./cors-middleware";

describe("lib/cors-middleware", () => {
  const app = new App<Request>();
  const baseOptions: CorsMiddlewareOptions = {
    allowOrigin: "https://example.com",
    allowMethods: ["GET", "POST"],
    allowHeaders: ["Content-Type"],
    allowCredentials: true,
    maxAge: 300,
    varyOrigin: true,
  };
  const path = "/test";
  const port = 10003;
  const httpRequest = makeAsyncClient(port);
  let server: TestServer;

  beforeAll(async () => {
    server = createHttpServer(app);
    await server.listen(port);
  });

  afterAll(async () => {
    await server.close();
  });

  afterEach(() => {
    app.remove_all_handlers();
    app.remove_middleware();
  });

  describe("with default options", () => {
    const mw = middleware.cors();

    it("sets the CORS headers", async () => {
      app.use(mw);

      app.get(path, (_req, res) => {
        expect(res.getHeader("access-control-allow-origin")).toBe("*");
        expect(res.getHeader("access-control-allow-methods")).toBe(
          "GET, POST, PUT, DELETE, OPTIONS",
        );
        expect(res.getHeader("access-control-allow-headers")).toBe(
          "Content-Type, Authorization",
        );
        expect(res.getHeader("access-control-max-age")).toBe("86400");
        expect(res.getHeader("access-control-allow-credentials")).toBe(
          undefined,
        );
        expect(res.getHeader("vary")).toBe(undefined);
        res.end("ok");
      });

      const { res, data } = await httpRequest({ method: "GET", path });
      expect(data).toBe("ok");
      expect(res.statusCode).toBe(200);
    });
  });

  describe("with custom options", () => {
    const mw = middleware.cors(baseOptions);

    it("sets the CORS headers", async () => {
      app.use(mw);

      app.get(path, (_req, res) => {
        expect(res.getHeader("access-control-allow-origin")).toBe(
          baseOptions.allowOrigin,
        );
        expect(res.getHeader("access-control-allow-methods")).toBe(
          baseOptions.allowMethods?.join(", "),
        );
        expect(res.getHeader("access-control-allow-headers")).toBe(
          baseOptions.allowHeaders?.join(", "),
        );
        expect(res.getHeader("access-control-max-age")).toBe(
          baseOptions.maxAge?.toString(),
        );
        expect(res.getHeader("access-control-allow-credentials")).toBe("true");
        expect(res.getHeader("vary")).toBe("Origin");
        res.end("ok");
      });

      const { res, data } = await httpRequest({ method: "GET", path });
      expect(data).toBe("ok");
      expect(res.statusCode).toBe(200);
    });
  });

  describe("with OPTIONS request", () => {
    const mw = middleware.cors(baseOptions);

    it("returns 204 status", async () => {
      app.use(mw);

      app.options(path, (_req, res) => {
        res.end("ok");
      });

      const { res, data } = await httpRequest({ method: "OPTIONS", path });
      expect(res.statusCode).toBe(204);
      expect(data).toBe("");
    });
  });

  describe("with unset options", () => {
    const mw = middleware.cors({
      allowOrigin: "",
      allowMethods: [],
      allowHeaders: [],
      maxAge: 0,
    });

    it("sets the CORS headers", async () => {
      app.use(mw);

      app.get(path, (_req, res) => {
        expect(res.getHeader("access-control-allow-origin")).toBe(undefined);
        expect(res.getHeader("access-control-allow-methods")).toBe(undefined);
        expect(res.getHeader("access-control-allow-headers")).toBe(undefined);
        expect(res.getHeader("access-control-max-age")).toBe(undefined);
        expect(res.getHeader("access-control-allow-credentials")).toBe(
          undefined,
        );
        expect(res.getHeader("vary")).toBe(undefined);
        res.end("ok");
      });

      const { res, data } = await httpRequest({ method: "GET", path });
      expect(data).toBe("ok");
      expect(res.statusCode).toBe(200);
    });
  });
});
