import { gunzip } from 'zlib';
import type { IncomingMessage } from 'http';

export async function get_body(req: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', function (buf) {
      chunks.push(buf);
    });

    req.on('end', () => {
      const body = Buffer.concat(chunks);
      if (req.headers['content-encoding'] === 'gzip') {
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

    req.on('error', (err) => {
      reject(err);
    });
  });
}
