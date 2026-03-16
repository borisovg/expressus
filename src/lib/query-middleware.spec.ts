/**
 * @author George Borisov <git@gir.me.uk>
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { QueryRequest, Response } from "..";
import { App, middleware } from "..";
import { makeAsyncClient } from "../test-helpers/http-client";
import { createHttpServer, type TestServer } from "../test-helpers/http-server";
import type { RequestWithQuery } from "./query-middleware";

describe("lib/query-middleware", () => {
  const app = new App<QueryRequest>();
  const path = "/test?foo=foofoo";
  const port = 10002;
  const httpRequest = makeAsyncClient(port);
  let r: QueryRequest;
  let server: TestServer;

  beforeAll(async () => {
    server = createHttpServer(app);
    await server.listen(port);
  });

  afterAll(async () => {
    await server.close();
  });

  it("register middleware", () => {
    app.use(middleware.query());
  });

  it("creates req.query object", async () => {
    app.get("/test", (req, res) => {
      r = req;
      expect(req.query.foo).toBe("foofoo");
      res.end("ok");
    });

    const { data } = await httpRequest({ method: "GET", path });
    expect(data).toBe("ok");
  });

  it("trims req.url down to path", () => {
    expect(r.url).toBe("/test");
  });

  it("adds req.originalUrl property with original request URL", () => {
    expect(r.originalUrl).toBe(path);
  });

  it("handles edge case where URL is undefined on the request", async () => {
    const req = { headers: { host: "example.com" } } as RequestWithQuery;

    await new Promise<void>((resolve) => {
      middleware.query()(req, {} as Response, () => {
        expect(req.query).toEqual({});
        expect(req.originalUrl).toBeUndefined();
        expect(req.url).toBe("/");
        resolve();
      });
    });
  });
});
