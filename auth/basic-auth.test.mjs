import test from 'node:test';
import assert from 'node:assert/strict';
import { createBasicAuth } from './basic-auth.mjs';
const env = { AUTH_USER: 'test-user', AUTH_PASSWORD: 'test:password-ä' };
const basic = value => 'Basic ' + Buffer.from(value).toString('base64');
function invoke(header, url = '/') {
  let next = false;
  const res = { headers: {}, setHeader(k,v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, type() { return this; }, send(s) { this.body = s; return this; } };
  createBasicAuth(env)({ headers: { authorization: header }, url }, res, () => { next = true; });
  return { next, res };
}
test('requires explicit credentials', () => {
  for (const value of [{}, { AUTH_USER: 'a' }, { AUTH_PASSWORD: 'b' }, { AUTH_USER: 'a:b', AUTH_PASSWORD: 'c' }]) assert.throws(() => createBasicAuth(value));
});
test('all paths and bad credentials are rejected', () => {
  for (const path of ['/', '/api/health', '/api/jobs', '/api/jobs/id/download', '/index.html']) {
    for (const header of [undefined, '', 'Bearer x', 'Basic !!!', basic('test-user:wrong'), basic('wrong:test:password-ä')]) {
      const result = invoke(header, path);
      assert.equal(result.next, false);
      assert.equal(result.res.code, 401);
      assert.match(result.res.headers['WWW-Authenticate'], /^Basic /);
    }
  }
});
test('correct credentials including colon and UTF-8 password pass', () => {
  assert.equal(invoke(basic(`${env.AUTH_USER}:${env.AUTH_PASSWORD}`)).next, true);
});
