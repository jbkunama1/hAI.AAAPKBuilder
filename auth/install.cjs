const fs = require('node:fs');
const file = '/app/server.js';
const source = fs.readFileSync(file, 'utf8');
const marker = 'const app = express();';
if (source.split(marker).length !== 2 || source.indexOf('app.use(') < source.indexOf(marker)) {
  throw new Error('Upstream Express structure changed; refusing unprotected build.');
}
fs.writeFileSync(file, 'import { createBasicAuth } from \"/opt/hai-auth/basic-auth.mjs\";\n'.replaceAll('\\\"', '\"').replace('\\n', '\n') + source.replace(marker, marker + '\napp.use(createBasicAuth());'));
