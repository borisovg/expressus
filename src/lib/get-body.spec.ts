/**
 * @author George Borisov <git@gir.me.uk>
 */

import assert from 'node:assert';
import { Readable } from 'node:stream';

const { get_body } = require('./get-body');

describe('lib/get-body', () => {
  it('throws an error if stream emits error', async () => {
    const req = new Readable({ read() {} });
    setImmediate(() => req.emit('error', new Error('test')));
    await assert.rejects(() => get_body(req), { message: 'test' });
  });
});
