/**
 * @author George Borisov <git@gir.me.uk>
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { App, type middleware } from ".";
import { makeAsyncClient } from "./test-helpers/http-client";
import { createHttpServer, type TestServer } from "./test-helpers/http-server";

type MiddlewareFn = ReturnType<typeof middleware.body>;

describe("lib/App.js", () => {
  const port = 10008;
  const httpRequest = makeAsyncClient(port);
  const path = "/test/foofoo/bar/baz";
  const app = new App();
  let server: TestServer;

  beforeAll(async () => {
    server = createHttpServer(app);
    await server.listen(port);
  });

  beforeEach(() => {
    app.remove_all_handlers();
    app.remove_middleware();
  });

  afterAll(async () => {
    await server.close();
  });

  it("creates HTTP server when called with no options", () => {
    expect(app).toBeInstanceOf(App);
  });

  it("exposes request handler as app.router", () => {
    expect(app.router).toBeTypeOf("function");
  });

  (["delete", "get", "options", "patch", "post", "put"] as const).forEach(
    (k) => {
      const m = k.toUpperCase();

      it(`registers ${m} handler`, async () => {
        app[k]("/test/:foo/*", (req, res) => {
          expect(req.method).toBe(m);
          expect(req.url).toBe(path);
          expect(req.params.foo).toBe("foofoo");
          expect(req.route).toBe("/test/:foo/*");
          expect(req.splat).toBe("bar/baz");

          req.on("data", (buffer) => {
            expect(buffer.toString()).toBe("bar");
          });

          req.on("end", () => {
            res.end("foo");
          });
        });

        const hasBody = ["PATCH", "POST", "PUT"].includes(m);
        const { res, data } = await httpRequest(
          { method: m, path },
          hasBody ? "bar" : undefined,
        );
        expect(res.statusCode).toBe(200);
        expect(data).toBe("foo");
      });
    },
  );

  it("registers middleware and applies it to request", async () => {
    let semaphore = 2;

    const mw: MiddlewareFn = (req, res, next) => {
      expect(req.url).toBe(path);
      expect(res.end).toBeTypeOf("function");
      expect(next).toBeTypeOf("function");

      semaphore -= 1;
      next();
    };

    for (let i = 0; i < 2; i += 1) {
      app.use(mw);
    }

    app.get(path, (_req, res) => {
      res.end("foo");
    });

    const { res, data } = await httpRequest({ method: "GET", path });

    expect(res.statusCode).toBe(200);
    expect(data).toBe("foo");
    expect(semaphore).toBe(0);
  });

  it("returns 404 in strange method", async () => {
    const { res, data } = await httpRequest({ method: "ACL", path });
    expect(res.statusCode).toBe(404);
    expect(data).toBeTypeOf("string");
  });

  it("returns 404 in unknown route", async () => {
    const { res, data } = await httpRequest({
      method: "GET",
      path: "/spanner",
    });
    expect(res.statusCode).toBe(404);
    expect(data).toBeTypeOf("string");
  });

  it("removes all handlers", async () => {
    app.get(path, (_req, res) => {
      res.end("foo");
    });

    app.remove_all_handlers();

    const { res } = await httpRequest({ method: "GET", path });
    expect(res.statusCode).toBe(404);
  });

  it("remove_middleware() idempotently removes middleware", async () => {
    let counter = 0;

    const mw: MiddlewareFn = (_req, _res, next) => {
      counter += 1;
      next();
    };

    app.use(mw);

    await httpRequest({ method: "GET", path });
    expect(counter).toBe(1);

    app.remove_middleware(mw);

    await httpRequest({ method: "GET", path });
    expect(counter).toBe(1);
    app.remove_middleware(mw);
  });

  it("correctly strips hashes and queries", async () => {
    const paths = [
      "/foo/bar?abc=123",
      "/foo/bar#baz",
      "/foo/bar?abc=123#baz",
      "/foo/bar#baz?abc=123",
    ];

    for (const testPath of paths) {
      app.remove_all_handlers();
      app.remove_middleware();

      const route = "/foo/:bar";

      app.get(route, (req, res) => {
        expect(req.route).toBe(route);
        expect(req.url).toBe(testPath);
        res.end();
      });

      const { res } = await httpRequest({ method: "GET", path: testPath });
      expect(res.statusCode).toBe(200);
    }
  });
});
