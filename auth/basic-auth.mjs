import { createHash, timingSafeEqual } from 'node:crypto';
const digest = value => createHash('sha256').update(value, 'utf8').digest();
export function createBasicAuth(env = process.env) {
  const user = env.AUTH_USER;
  const password = env.AUTH_PASSWORD;
  if (!user || !password || /[:\x00-\x1f\x7f]/.test(user) || /[\x00-\x1f\x7f]/.test(password)) {
    throw new Error('Valid AUTH_USER and AUTH_PASSWORD are required; access will not start without credentials.');
  }
  const expected = digest(`${user}:${password}`);
  return (req, res, next) => {
    const header = req.headers.authorization;
    const match = typeof header === 'string' && /^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(header);
    let valid = false;
    if (match && match[1].length <= 16384) {
      const decoded = Buffer.from(match[1], 'base64').toString('utf8');
      valid = timingSafeEqual(digest(decoded), expected);
    }
    if (valid) return next();
    res.setHeader('WWW-Authenticate', 'Basic realm="hAI.AAAPKBuilder", charset="UTF-8"');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Connection', 'close');
    res.status(401).type('text/plain').send('Authentication required.');
  };
}
