# Thrive Email Signatures

Two things live here:

1. **The builder** — `index.html`, served at
   <https://thriveassetmx.github.io/thrive-email-signatures/>
2. **The headshots** — `people/`, which the generated signatures load from.

## Sending someone a prefilled link

Fill in a colleague's name, title, phone, email and company, then press
**Copy prefilled link** and send it to them. The page opens with everything
already entered — they add a photo, press **Copy signature**, and paste it into
Outlook. Nothing to install, no account, no password.

The details travel in the part of the address after `#`. Browsers never send a
fragment to the server, so names, phone numbers and addresses stay out of
request logs and referrer headers.

## How it works

Open the builder, fill in name / title / phone / email, pick the company, and
drop in a photo. The tool then:

1. **Crops a square** — top-aligned by default, so the head is protected and
   the chest is trimmed. A slider adjusts this if a photo has headroom to spare.
2. **Exports at 404×404**, twice the display size, so it stays sharp on retina.
3. **Commits it to `people/`** in this repo.
4. **Points the signature HTML at that address**, once GitHub Pages has
   published it.

Then press **Copy signature** and paste into Outlook.

## Why the upload asks for a token

This page is public. A write token baked into it would let anyone on the
internet commit to this repo, so the builder ships with no credentials of its
own — you sign in with yours.

Create a **fine-grained personal access token**:

- <https://github.com/settings/personal-access-tokens/new>
- Repository access → **Only select repositories** → `thrive-email-signatures`
- Permissions → Repository permissions → **Contents: Read and write**
- Nothing else.

The token is kept in your browser's `localStorage` and sent only to
`api.github.com`. **Forget token** clears it. It is never written into the page
or committed here.

If you would rather staff not handle tokens at all, the alternative is a small
serverless function holding one secret, with the page calling that instead.
That needs hosting outside GitHub Pages.

## Doing it by hand instead

The token step is optional. Without it, right-click the square crop the builder
shows you → **Save image as…** → commit it to `people/` yourself → paste the
address into **Hosted photo URL**.

## Photos must be public

Mail clients fetch signature images over plain HTTP with no login, so this repo
is public and a private one would not work.

## Where the brand assets come from

Logos and icons are pulled live from
[`thrive-brand-book`](https://github.com/thriveassetmx/thrive-brand-book), so a
logo update there flows through on its own.

All five company logos render at the **same 45px height**; widths differ
because each lockup has its own proportions (2.85:1 to 3.34:1). The source
files are tightly trimmed, so equal height is equal *optical* height.
