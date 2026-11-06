// مخابز الياسمين - خادم بدون أي مكتبات خارجية (Node 18+)
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUB = __dirname;
const ALLOWED = new Set(['index.html', 'style.css', 'script.js']);
const DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DIR, 'data.json');
const ORDERS_FILE = path.join(DIR, 'orders.json');
fs.mkdirSync(DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.copyFileSync(path.join(__dirname, 'default-data.json'), DATA_FILE);
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]');

// ---- بيانات الإدارة ----
// لتغيير الدخول: ADMIN_EMAIL و ADMIN_PASSWORD كمتغيرات بيئة. الافتراضي: كلمة المرور المشفّرة أدناه.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'alyasminbakery407@gmail.com').toLowerCase();
let PW = 'afecad517e9efc56e57e96ab08a21a75:df36ddbdc6273f1ec4251fa5706080d602d2bfe1cb56d9ecde5a5f4abb72dd46';
if (process.env.ADMIN_PASSWORD) {
  const s = crypto.randomBytes(16).toString('hex');
  PW = s + ':' + crypto.scryptSync(process.env.ADMIN_PASSWORD, s, 32).toString('hex');
}
function checkPw(p) {
  const [s, h] = PW.split(':');
  const a = crypto.scryptSync(String(p), s, 32), b = Buffer.from(h, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const sessions = new Map(); // token -> expiry
const fails = new Map();    // ip -> {n, t}
const orderHits = new Map();
const TTL = 12 * 3600 * 1000;
const ip = req => (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
const authed = req => {
  const t = (req.headers.authorization || '').replace(/^Bearer /, '');
  const e = sessions.get(t);
  if (e && e > Date.now()) return t;
  sessions.delete(t); return null;
};
const send = (res, code, obj) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
};
const body = (req, max = 30e6) => new Promise((ok, no) => {
  let n = 0; const ch = [];
  req.on('data', c => { n += c.length; if (n > max) { no(new Error('big')); req.destroy(); } else ch.push(c); });
  req.on('end', () => { try { ok(JSON.parse(Buffer.concat(ch).toString() || '{}')); } catch (e) { no(e); } });
  req.on('error', no);
});
const save = (file, obj) => { const t = file + '.tmp'; fs.writeFileSync(t, JSON.stringify(obj)); fs.renameSync(t, file); };
const str = (v, n) => String(v == null ? '' : v).slice(0, n);

async function api(req, res, url) {
  try {
    if (url === '/api/data' && req.method === 'GET') return send(res, 200, JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));

    if (url === '/api/login' && req.method === 'POST') {
      const k = ip(req), f = fails.get(k) || { n: 0, t: Date.now() };
      if (Date.now() - f.t > 600000) { f.n = 0; f.t = Date.now(); }
      if (f.n >= 5) return send(res, 429, { error: 'محاولات كثيرة، حاول بعد 10 دقائق' });
      const b = await body(req, 1e4);
      if (str(b.email, 200).trim().toLowerCase() === ADMIN_EMAIL && checkPw(str(b.password, 200))) {
        fails.delete(k);
        const t = crypto.randomBytes(32).toString('hex'); sessions.set(t, Date.now() + TTL);
        return send(res, 200, { token: t });
      }
      f.n++; fails.set(k, f);
      return send(res, 401, { error: 'البريد أو كلمة المرور غير صحيحة' });
    }

    if (url === '/api/logout' && req.method === 'POST') { const t = authed(req); if (t) sessions.delete(t); return send(res, 200, { ok: 1 }); }

    if (url === '/api/data' && req.method === 'PUT') {
      if (!authed(req)) return send(res, 401, { error: 'unauthorized' });
      const b = await body(req);
      if (!b || !Array.isArray(b.products)) return send(res, 400, { error: 'بيانات غير صالحة' });
      save(DATA_FILE, b); return send(res, 200, { ok: 1 });
    }

    if (url === '/api/orders' && req.method === 'POST') {
      const k = ip(req), h = (orderHits.get(k) || []).filter(t => Date.now() - t < 60000);
      if (h.length >= 5) return send(res, 429, { error: 'كثير من الطلبات، حاول بعد قليل' });
      h.push(Date.now()); orderHits.set(k, h);
      const b = await body(req, 1e5);
      const o = { t: new Date().toISOString(), name: str(b.name, 100), phone: str(b.phone, 40), addr: str(b.addr, 300), note: str(b.note, 500), text: str(b.text, 3000), total: str(b.total, 30) };
      if (!o.name || !o.phone || !o.text) return send(res, 400, { error: 'بيانات ناقصة' });
      const all = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); all.unshift(o); save(ORDERS_FILE, all.slice(0, 1000));
      return send(res, 200, { ok: 1 });
    }

    if (url === '/api/orders' && req.method === 'GET') {
      if (!authed(req)) return send(res, 401, { error: 'unauthorized' });
      return send(res, 200, JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')));
    }
    send(res, 404, { error: 'not found' });
  } catch (e) { send(res, 400, { error: 'طلب غير صالح' }); }
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  if (url.startsWith('/api/')) return api(req, res, url);
  const name = url === '/' ? 'index.html' : url.slice(1);
  if (!ALLOWED.has(name)) { res.writeHead(404); return res.end('Not found'); }
  const f = path.join(PUB, name);
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(d);
  });
}).listen(PORT, () => console.log('مخابز الياسمين تعمل على http://localhost:' + PORT));
