/**
 * Thrive signature photo uploader.
 *
 * The builder page is public, so it can hold no credentials. This Worker holds
 * them instead: staff type one shared password, the Worker checks it and does
 * the GitHub commit with a token that never leaves the server.
 *
 * Secrets (set with `wrangler secret put NAME`, never in wrangler.toml):
 *   UPLOAD_PASSWORD  the one password you give the team
 *   GITHUB_TOKEN     fine-grained PAT, Contents: Read and write, this repo only
 */

const REPO = 'thriveassetmx/thrive-email-signatures';
const ALLOWED_ORIGIN = 'https://thriveassetmx.github.io';
const MAX_BYTES = 3 * 1024 * 1024;           // a 404x404 PNG is ~150KB; 3MB is generous
const FILENAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/;   // people/<slug>.png only

const cors = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin'
};
const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

/* Compare digests rather than the raw strings, so a wrong password cannot be
   discovered one character at a time from response timing. */
async function sameSecret(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b))
  ]);
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let diff = u.length ^ v.length;
  for (let i = 0; i < Math.max(u.length, v.length); i++) diff |= (u[i] ?? 0) ^ (v[i] ?? 0);
  return diff === 0;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json(405, { error: 'Use POST.' });
    if (request.headers.get('Origin') !== ALLOWED_ORIGIN)
      return json(403, { error: 'Requests are only accepted from the builder page.' });
    if (!env.UPLOAD_PASSWORD || !env.GITHUB_TOKEN)
      return json(500, { error: 'Uploader is not configured. Set UPLOAD_PASSWORD and GITHUB_TOKEN.' });

    let body;
    try { body = await request.json(); } catch { return json(400, { error: 'Expected JSON.' }); }
    const { password, filename, contentBase64 } = body || {};

    if (!(await sameSecret(password, env.UPLOAD_PASSWORD))) {
      /* A short shared password is only safe if guessing is slow. Stalling every
         rejection makes an online brute force impractical (~1.5s per attempt),
         and Cloudflare's own protections sit in front of this. */
      await new Promise(r => setTimeout(r, 1500));
      return json(401, { error: 'Wrong password.' });
    }

    if (!FILENAME_RE.test(String(filename || '')))
      return json(400, { error: 'Filename must look like firstname-lastname-square.png — lowercase letters, numbers and hyphens only.' });

    if (typeof contentBase64 !== 'string' || !contentBase64)
      return json(400, { error: 'No image data received.' });
    if (Math.floor(contentBase64.length * 3 / 4) > MAX_BYTES)
      return json(413, { error: 'That image is larger than 3 MB.' });

    /* Confirm it really is a PNG: base64 of the 8-byte PNG signature. */
    if (!contentBase64.startsWith('iVBORw0KGgo'))
      return json(400, { error: 'That does not look like a PNG.' });

    const path = `people/${filename}`;
    const api = `https://api.github.com/repos/${REPO}/contents/${path}`;
    const gh = {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'thrive-signature-uploader',
      'Content-Type': 'application/json'
    };

    /* Overwriting an existing file requires its current blob sha. */
    let sha = null;
    const probe = await fetch(api, { headers: gh });
    if (probe.status === 200) sha = (await probe.json()).sha;
    else if (probe.status === 401 || probe.status === 403)
      return json(502, { error: 'The server’s GitHub token was rejected. An admin needs to refresh it.' });

    const put = await fetch(api, {
      method: 'PUT',
      headers: gh,
      body: JSON.stringify({
        message: `Add signature photo: ${filename}`,
        content: contentBase64,
        ...(sha ? { sha } : {})
      })
    });

    if (!put.ok) {
      let detail = String(put.status);
      try { detail = (await put.json()).message || detail; } catch {}
      return json(502, { error: `GitHub rejected the commit: ${detail}` });
    }

    return json(200, {
      ok: true,
      url: `https://thriveassetmx.github.io/thrive-email-signatures/people/${filename}`,
      replaced: Boolean(sha)
    });
  }
};
