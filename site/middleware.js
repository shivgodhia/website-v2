// Password gate for the preview. Active only when PREVIEW_PASSWORD is set on
// the Vercel project, so removing that variable makes the site public.
import { next } from '@vercel/functions';

const COOKIE = 'preview_auth';

async function token(password) {
  const data = new TextEncoder().encode('shivgodhia-preview:' + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  const match = header.split(/;\s*/).find((c) => c.startsWith(name + '='));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function page(wrong) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Preview</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f1f2ee;color:#161b26;font:17px/1.5 Georgia,serif}
form{width:min(20rem,86vw)}
h1{font:700 1.6rem/1.1 "Helvetica Neue",Arial,sans-serif;letter-spacing:-.02em;margin:0 0 .4rem}
p{margin:0 0 1.25rem;color:#545b68}
input{width:100%;box-sizing:border-box;font:inherit;padding:.75rem .9rem;border:1px solid #cfd3d6;border-radius:.6rem;background:#fff}
input:focus{outline:3px solid #2343d6;outline-offset:2px}
button{margin-top:.75rem;width:100%;font:600 1rem "Helvetica Neue",Arial,sans-serif;padding:.8rem;border:0;border-radius:999px;background:#161b26;color:#f1f2ee;cursor:pointer}
.err{color:#b3261e;margin:.75rem 0 0}
</style></head><body>
<form method="post" action="/__preview-login">
<h1>Preview</h1><p>This version of the site isn't public yet.</p>
<label for="pw" style="position:absolute;left:-999px">Password</label>
<input id="pw" name="password" type="password" placeholder="Password" autocomplete="current-password" autofocus required>
<button type="submit">Open preview</button>
${wrong ? '<p class="err" role="alert">That password is wrong. Try again.</p>' : ''}
</form></body></html>`;
}

function html(body, status) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex', 'cache-control': 'no-store' },
  });
}

export default async function middleware(request) {
  const password = process.env.PREVIEW_PASSWORD;
  if (!password) return next();

  const expected = await token(password);
  const url = new URL(request.url);

  if (url.pathname === '/__preview-login' && request.method === 'POST') {
    const form = await request.formData();
    if (form.get('password') !== password) return html(page(true), 401);
    return new Response(null, {
      status: 303,
      headers: {
        location: '/',
        'set-cookie': `${COOKIE}=${expected}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  if (readCookie(request, COOKIE) === expected) {
    return next({ headers: { 'x-robots-tag': 'noindex' } });
  }
  return html(page(false), 401);
}
