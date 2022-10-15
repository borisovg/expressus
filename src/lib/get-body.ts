import type { IncomingMessage } from 'http';

export async function get_body(req: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', function (buf) {
      chunks.push(buf);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}
