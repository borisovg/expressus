import http from 'node:http';

type RequestOpts = Pick<http.RequestOptions, 'method' | 'path'> & {
  type?: string;
};

export function makeClient(port: number) {
  return function request(
    opts: RequestOpts,
    data?: unknown,
    callback?: (res: http.IncomingMessage, data: string) => void
  ) {
    const req = http.request(
      { port: port, method: opts.method, path: opts.path },
      function (res) {
        const chunks: Buffer[] = [];

        res.on('data', function (buffer) {
          chunks.push(buffer);
        });

        res.on('end', function () {
          if (callback) {
            callback(res, Buffer.concat(chunks).toString());
          }
        });
      }
    );

    if (opts.type) {
      req.setHeader('Content-Type', opts.type);
    }

    if (data) {
      req.write(data);
    }

    req.end();
  };
}
