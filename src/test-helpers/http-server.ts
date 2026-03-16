import * as http from "node:http";
import type { App } from "../App";

export type TestServer = {
  close: () => Promise<void>;
  listen: (port: number) => Promise<void>;
};

export function createHttpServer<
  ReqMiddleware extends object = object,
  ResMiddleware extends object = object,
>(app: App<ReqMiddleware, ResMiddleware>): TestServer {
  const server = http.createServer(app.router);

  return {
    async close() {
      return new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      });
    },

    async listen(port: number) {
      return new Promise<void>((resolve) => {
        server.listen(port, () => {
          resolve();
        });
      });
    },
  };
}
