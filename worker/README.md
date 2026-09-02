# One shared password instead of per-person tokens

The builder page is public, so it cannot hold a GitHub token — anyone could read
it out of the page source and commit to the repo. This Worker holds the
credentials instead. Staff type one password; the Worker checks it and performs
the commit.

## Deploy (about five minutes)

```bash
npm install -g wrangler
wrangler login
cd worker
wrangler secret put UPLOAD_PASSWORD   # the password you hand the team
wrangler secret put GITHUB_TOKEN      # fine-grained PAT, see below
wrangler deploy
```

`wrangler deploy` prints an address like
`https://thrive-signature-upload.<subdomain>.workers.dev`.

Put it in `index.html`, one line near the top of the script:

```js
const UPLOAD_ENDPOINT='https://thrive-signature-upload.<subdomain>.workers.dev';
```

Commit that, and the page switches from the token field to a single password
field for everyone. Leave it `''` and it stays in token mode.

## The GitHub token this Worker holds

- <https://github.com/settings/personal-access-tokens/new>
- Repository access → **Only select repositories** → `thrive-email-signatures`
- Permissions → **Contents: Read and write**. Nothing else.

Set it with `wrangler secret put` only. Never put it in `wrangler.toml`, and
never in `index.html` — that file is public.

## What the Worker refuses

Verified by test:

| Request | Result |
|---|---|
| Wrong password | 401, generic message |
| Filename with `../` or uppercase | 400 |
| Content that is not a PNG | 400 |
| Larger than 3 MB | 413 |
| Called from any other site | 403 |

Writes are confined to `people/<slug>.png`. The password is compared as a
SHA-256 digest, so a wrong guess cannot be narrowed down from response timing.

## Changing the password

`wrangler secret put UPLOAD_PASSWORD` again, then `wrangler deploy`. Anyone
holding the old one loses access immediately.

## If you would rather not run a Worker

Netlify Functions, Vercel, or any host that keeps a secret works the same way —
accept `{password, filename, contentBase64}`, check the password, call the
GitHub Contents API. Or skip it: token mode already works with no server.
