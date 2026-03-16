/**
 * @author George Borisov <git@gir.me.uk>
 */

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { FormRequest } from "..";
import { App, middleware } from "..";
import { makeAsyncClient } from "../test-helpers/http-client";
import { createHttpServer, type TestServer } from "../test-helpers/http-server";

describe("lib/form-middleware", () => {
  const app = new App<FormRequest>();
  const port = 10004;
  const httpRequest = makeAsyncClient(port);
  let server: TestServer;

  beforeAll(async () => {
    server = createHttpServer(app);
    await server.listen(port);
  });

  afterAll(async () => {
    await server.close();
  });

  afterEach(() => app.remove_all_handlers());

  it("register middleware", () => {
    app.use(middleware.form());
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

  it("does not parse without form content type", async () => {
    await new Promise<void>((resolve) => {
      app.post("/test", (req, res) => {
        expect(req.body).toBeUndefined();
        res.end();
        resolve();
      });

      httpRequest(
        { method: "POST", path: "/test", type: "text/plain" },
        "foo=foofoo",
      );
    });
  });

  it("does not parse if request body is empty", async () => {
    await new Promise<void>((resolve) => {
      app.post("/test", (req, res) => {
        expect(req.body).toBeUndefined();
        res.end();
        resolve();
      });

      httpRequest(
        {
          method: "POST",
          path: "/test",
          type: "application/x-www-form-urlencoded",
        },
        "",
      );
    });
  });

  it("creates replaces req.body with parsed x-www-form-urlencoded data", async () => {
    await new Promise<void>((resolve) => {
      app.post("/test", (req, res) => {
        expect(req.body?.foo).toBe("foofoo");
        expect(req.body?.["/bar"]).toBe("/bar");
        res.end();
        resolve();
      });

      httpRequest(
        {
          method: "POST",
          path: "/test",
          type: "application/x-www-form-urlencoded",
        },
        "foo=foofoo&%2Fbar=%2Fbar",
      );
    });
  });

  it("returns HTTP 400 status on invalid form data", async () => {
    const { res, data } = await httpRequest(
      {
        method: "POST",
        path: "/test",
        type: "application/x-www-form-urlencoded",
      },
      "spanner",
    );
    expect(res.statusCode).toBe(400);
    expect(data.match(/(^\d+)/)?.[1]).toBe("400");
  });
});
