const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const env_file = path.join(process.cwd(), '.env');
const token = crypto.randomBytes(18).toString('base64url');
let lines = [];

if (fs.existsSync(env_file)) {
    lines = fs
        .readFileSync(env_file, 'utf8')
        .split(/\r?\n/)
        .filter(Boolean)
        .filter(l => !l.startsWith('AUTH_TOKEN='));
}

lines.push(`AUTH_TOKEN=${token}`);
fs.writeFileSync(env_file, lines.join('\n') + '\n');
console.log('Generated AUTH_TOKEN:', token);
