/**
 * @author George Borisov <git@gir.me.uk>
 */

// import * as fs from "node:fs/promises";
import { fs, vol } from "memfs";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { App, middleware } from "..";
import { makeAsyncClient } from "../test-helpers/http-client";
import { createHttpServer, type TestServer } from "../test-helpers/http-server";

vi.mock("node:fs");
vi.mock("node:fs/promises");

describe("lib/static-middleware.js", () => {
  const app = new App();
  const port = 10007;
  const httpRequest = makeAsyncClient(port);
  let server: TestServer;
  const testDir = "./test/public";

  beforeAll(async () => {
    server = createHttpServer(app);
    await server.listen(port);
  });

  beforeEach(() => {
    fs.mkdirSync(testDir, { recursive: true });
    app.use(middleware.static({ path: testDir }));
  });

  afterAll(async () => {
    await server.close();
  });

  afterEach(() => {
    app.remove_all_handlers();
    app.remove_middleware();
    vi.restoreAllMocks();
    vol.reset();
  });

  it('defaults to "./public" for path', async () => {
    app.remove_middleware();
    app.use(middleware.static());

    fs.mkdirSync("./public", { recursive: true });
    fs.writeFileSync("./public/test.txt", "test");

    const { res, data } = await httpRequest({
      method: "GET",
      path: "/test.txt",
    });
    expect(res.statusCode).toBe(200);
    expect(data).toBe("test");
  });

  (
    [
      ["test.txt", "text/plain; charset=utf-8", "test"],
      [
        "pixel.png",
        "image/png",
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
          "base64",
        ),
      ],
    ] as const
  ).forEach(([file, contentType, expected]) => {
    it(`serves ${file} with content-type ${contentType}`, async () => {
      fs.writeFileSync(`${testDir}/${file}`, expected);
      const { res, data } = await httpRequest({
        method: "GET",
        path: `/${file}`,
      });
      expect(data).toBe(expected.toString());
      expect(res.headers["content-type"]).toBe(contentType);
    });
  });

  it('sets "content-type" header to "application/octet-stream" for unknown file types', async () => {
    const file = "test.xxx";
    fs.writeFileSync(`${testDir}/${file}`, "test");
    const { res } = await httpRequest({ method: "GET", path: `/${file}` });
    expect(res.headers["content-type"]).toBe("application/octet-stream");
  });

  it("only considers GET requests", async () => {
    const file = "test1.txt";
    fs.writeFileSync(`${testDir}/${file}`, "test");

    app.post(`/${file}`, (_req, res) => {
      res.end("ok");
    });

    const { data } = await httpRequest({ method: "POST", path: `/${file}` });
    expect(data).toBe("ok");
  });

  it("ignores routes without extension", async () => {
    const file = "test2";
    fs.writeFileSync(`${testDir}/${file}`, "test");

    app.get(`/${file}`, (_req, res) => {
      res.end("ok");
    });

    const { data } = await httpRequest({ method: "GET", path: `/${file}` });
    expect(data).toBe("ok");
  });

  it('ignores routes that include ".." string', async () => {
    const file = "../test3.txt";
    fs.writeFileSync(`${testDir}/${file}`, "test");

    app.get(`/${file}`, (_req, res) => {
      res.end("ok");
    });

    const { data } = await httpRequest({ method: "GET", path: `/${file}` });
    expect(data).toBe("ok");
  });

  it("continues to dynamic router if file not found", async () => {
    const file = "test3.txt";

    app.get(`/${file}`, (_req, res) => {
      res.end("ok");
    });

    const { data } = await httpRequest({ method: "GET", path: `/${file}` });
    expect(data).toBe("ok");
  });

  it("returns HTTP 500 status on file access error", async () => {
    const file = "test.txt";
    fs.writeFileSync(`${testDir}/${file}`, "test");
    fs.chmodSync(`${testDir}/${file}`, "222");

    const { res } = await httpRequest({ method: "GET", path: `/${file}` });
    expect(res.statusCode).toBe(500);
  });

  it("returns HTTP 500 error on file stat error", async () => {
    const file = "test.txt";
    fs.writeFileSync(`${testDir}/${file}`, "test");

    vi.spyOn(fs, "stat").mockImplementation(((_path, callback) => {
      if (typeof callback === "function")
        callback(new Error("spanner"), {} as InstanceType<typeof fs.Stats>);
    }) as typeof fs.stat);

    const { res } = await httpRequest({ method: "GET", path: `/${file}` });
    expect(res.statusCode).toBe(500);
  });

  it("handles edge case where URL is undefined on the request", async () => {
    await new Promise<void>((resolve) => {
      // biome-ignore lint/suspicious/noExplicitAny: type is irrelevant here
      middleware.static()({} as any, {} as any, () => {
        resolve();
      });
    });
  });
});
