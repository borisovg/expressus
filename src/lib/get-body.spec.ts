/**
 * @author George Borisov <git@gir.me.uk>
 */

import { Readable } from "node:stream";
import { gzip } from "node:zlib";
import { describe, expect, it } from "vitest";
import { get_body } from "..";
import type { Request } from "../types";

describe("lib/get-body", () => {
  it("throws an error if stream emits error", async () => {
    const req = new Readable({ read() {} }) as Request;
    setImmediate(() => req.emit("error", new Error("test")));
    await expect(get_body(req)).rejects.toThrow("test");
  });

  it("supports gzip encoded data", async () => {
    const req = new Readable({
      read() {
        gzip(Buffer.from("foo"), (err, data) => {
          expect(err).toBeNull();
          this.push(data);
          this.push(null);
        });
      },
    }) as Request;

    req.headers = {
      "content-encoding": "gzip",
    };

    const data = await get_body(req);
    expect(data.toString()).toBe("foo");
  });

  it("throws an error if gzip decoding fails", async () => {
    const req = new Readable({
      read() {
        this.push(Buffer.from("foo"));
        this.push(null);
      },
    }) as Request;

    req.headers = {
      "content-encoding": "gzip",
    };

    await expect(get_body(req)).rejects.toThrow("incorrect header check");
  });

  it("is idempotent", async () => {
    const req = new Readable({
      read() {
        this.push(Buffer.from("foo"));
        this.push(null);
      },
    }) as Request;

    req.headers = {};

    let data = await get_body(req);
    expect(data.toString()).toBe("foo");

    data = await get_body(req);
    expect(data.toString()).toBe("");
  });
});
