import type { IncomingMessage } from "node:http";
import { gunzip } from "node:zlib";

export async function get_body(req: IncomingMessage) {
  if (req.readableEnded) {
    return Buffer.from("");
  }

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (buf) => {
      chunks.push(buf);
    });

    req.on("end", () => {
      const body = Buffer.concat(chunks);
      if (req.headers["content-encoding"] === "gzip") {
        gunzip(body, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      } else {
        resolve(body);
      }
    });

    req.on("error", (err) => {
      reject(err);
    });
  });
}
