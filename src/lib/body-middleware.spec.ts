/**
 * @author George Borisov <git@gir.me.uk>
 */

import type { ServerResponse } from "node:http";
import { Readable, Writable } from "node:stream";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { BodyRequest } from "..";
import { App, middleware } from "..";
import { makeAsyncClient } from "../test-helpers/http-client";
import { createHttpServer, type TestServer } from "../test-helpers/http-server";
import type { RequestWithBody } from "./body-middleware";

describe("lib/body-middleware.js", () => {
  const app = new App<BodyRequest>();
  const port = 10005;
  const httpRequest = makeAsyncClient(port);
  let server: TestServer;

  beforeAll(async () => {
    server = createHttpServer(app);
    await server.listen(port);
  });

  beforeEach(() => {
    app.remove_all_handlers();
    app.remove_middleware();
    app.use(middleware.body());
  });

  afterAll(async () => {
    await server.close();
  });

  it("creates req.body object that is a buffer if request has body", async () => {
    app.post("/test", (req, res) => {
      expect(Buffer.isBuffer(req.body)).toBe(true);
      expect(req.body?.toString()).toBe("foofoo");
      res.end();
    });

    await httpRequest({ method: "POST", path: "/test" }, "foofoo");
  });

  it("does not create req.body if request has no body", async () => {
    app.post("/test", (req, res) => {
      expect(req.body).toBeUndefined();
      res.end();
    });

    await httpRequest({ method: "POST", path: "/test" });
  });

  (["get", "delete", "options"] as const).forEach((method) => {
    it(`does nothing for ${method.toUpperCase()} method`, async () => {
      app[method]("/test", (req, res) => {
        expect(req.body).toBeUndefined();
        res.end();
      });

      await httpRequest({ method, path: "/test" }, "foofoo");
    });
  });

  it("returns 400 on error", async () => {
    await new Promise<void>((resolve) => {
      const mw = middleware.body();
      const req = new Readable({ read() {} }) as RequestWithBody;
      const res = new Writable({
        write(buf) {
          expect(buf.toString()).toBe("400 Bad Request (test)");
          setImmediate(resolve);
        },
      }) as ServerResponse;

      setImmediate(() => req.emit("error", new Error("test")));

      mw(req, res, () => {
        throw new Error("this should not happen");
      });
    });
  });
});
