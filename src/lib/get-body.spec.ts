/**
 * @author George Borisov <git@gir.me.uk>
 */

import { rejects, strictEqual } from 'assert';
import { gzip } from 'zlib';
import { Readable } from 'stream';
import { Request } from '../types';

const { get_body } = require('./get-body');

describe('lib/get-body', () => {
  it('throws an error if stream emits error', async () => {
    const req = new Readable({ read() {} });
    setImmediate(() => req.emit('error', new Error('test')));
    await rejects(() => get_body(req), { message: 'test' });
  });

  it('supports gzip encoded data', async () => {
    const req = new Readable({
      read() {
        gzip(Buffer.from('foo'), (err, data) => {
          strictEqual(err, null);
          this.push(data);
          this.push(null);
        });
      },
    }) as Request;

    req.headers = {
      'content-encoding': 'gzip',
    };

    const data = await get_body(req);
    strictEqual(data.toString(), 'foo');
  });

  it('throws an error if gzip decoding fails', async () => {
    const req = new Readable({
      read() {
        this.push(Buffer.from('foo'));
        this.push(null);
      },
    }) as Request;

    req.headers = {
      'content-encoding': 'gzip',
    };

    rejects(get_body(req), { message: 'Error: incorrect header check' });
  });
});
