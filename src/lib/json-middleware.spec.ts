/**
 * @author George Borisov <git@gir.me.uk>
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { JsonRequest, JsonResponse } from "..";
import { App, middleware } from "..";
import { makeAsyncClient } from "../test-helpers/http-client";
import { createHttpServer, type TestServer } from "../test-helpers/http-server";

describe("lib/json-middleware", () => {
  const app = new App<JsonRequest, JsonResponse>();
  const port = 10006;
  const httpRequest = makeAsyncClient(port);
  let server: TestServer;

  beforeAll(async () => {
    server = createHttpServer(app);
    await server.listen(port);
  });

  beforeEach(() => {
    app.remove_all_handlers();
    app.remove_middleware();
    app.use(middleware.json());
  });

  afterAll(async () => {
    await server.close();
  });

  it("does not parse when there is no body", async () => {
    await new Promise<void>((resolve) => {
      app.post("/test", (req, res) => {
        expect(req.body).toBeUndefined();
        res.end();
        resolve();
      });

      httpRequest({ method: "POST", path: "/test" });
    });
  });

  it("does not parse without JSON content type", async () => {
    await new Promise<void>((resolve) => {
      app.post("/test", (req, res) => {
        expect(req.body).toBeUndefined();
        res.end();
        resolve();
      });

      httpRequest({ method: "POST", path: "/test" }, '{"foo":"foofoo"}');
    });
  });

  it("creates replaces req.body with parsed JSON", async () => {
    await new Promise<void>((resolve) => {
      app.post("/test", (req, res) => {
        expect(req.body).toEqual({ foo: "foofoo" });
        res.end();
        resolve();
      });

      httpRequest(
        { method: "POST", path: "/test", type: "application/json" },
        '{"foo":"foofoo"}',
      );
    });
  });

  it('creates replaces req.body with parsed JSON when "content-type" includes charset', async () => {
    await new Promise<void>((resolve) => {
      app.post("/test", (req, res) => {
        expect(req.body).toEqual({ foo: "foofoo" });
        res.end();
        resolve();
      });

      httpRequest(
        {
          method: "POST",
          path: "/test",
          type: "application/json;charset=utf-8",
        },
        '{"foo":"foofoo"}',
      );
    });
  });

  (["get", "post"] as const).forEach((method) => {
    it("adds res.json() which sends JSON to client", async () => {
      app[method]("/test", (_req, res) => {
        res.json({ bar: "foobar" });
      });

      const { res, data } = await httpRequest({
        method: method.toUpperCase(),
        path: "/test",
        type: "application/json",
      });
      const json = JSON.parse(data);
      expect(json.bar).toBe("foobar");
      expect(res.headers["content-type"]).toBe("application/json");
    });
  });

  it("returns HTTP 400 status on parse error", async () => {
    const { res, data } = await httpRequest(
      {
        method: "POST",
        path: "/test",
        type: "application/json",
      },
      "spanner",
    );

    const json = JSON.parse(data);
    expect(json.code).toBe(400);
    expect(res.statusCode).toBe(400);
  });

  it("does not conflict with body-middleware", async () => {
    app.remove_middleware();
    app.use(middleware.body());
    app.use(middleware.json());

    app.post("/test", (req, res) => {
      expect(req.body).toEqual({ foo: "foofoo" });
      res.end("ok");
    });

    const { res, data } = await httpRequest(
      {
        method: "POST",
        path: "/test",
        type: "application/json;charset=utf-8",
      },
      '{"foo":"foofoo"}',
    );
    expect(data).toBe("ok");
    expect(res.statusCode).toBe(200);
  });
});
