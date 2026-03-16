import { type IncomingMessage, type RequestOptions, request } from "node:http";

type RequestOpts = Pick<RequestOptions, "method" | "path"> & {
  type?: string;
};

export function makeAsyncClient(port: number) {
  return async (opts: RequestOpts, data?: unknown) => {
    return new Promise<{ res: IncomingMessage; data: string }>(
      (resolve, reject) => {
        const req = request(
          { port: port, method: opts.method, path: opts.path },
          (res) => {
            const chunks: Buffer[] = [];

            res.on("data", (buffer) => {
              chunks.push(buffer);
            });

            res.on("end", () => {
              resolve({ res, data: Buffer.concat(chunks).toString() });
            });
          },
        );

        if (opts.type) {
          req.setHeader("Content-Type", opts.type);
        }

        if (data) {
          req.write(data);
        }

        req.on("error", reject);

        req.end();
      },
    );
  };
}
