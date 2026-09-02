# Thrive Email Signatures

Two things live here:

1. **The builder** — `index.html`, served at
   <https://thriveassetmx.github.io/thrive-email-signatures/>.
   Fill in name, title, phone, email, pick the company, drop in a photo, and it
   hands back the signature HTML to paste into Outlook.

2. **The headshots** — `people/`. Every signature photo the team uses is
   committed here and served from this repo.

## Adding your photo

1. Open the builder and upload your photo. It crops a square for you —
   top-aligned by default, which protects the head and trims the chest.
2. Right-click the square it shows you → **Save image as…**
3. Commit it to `people/` as `firstname-lastname-square.png`.
4. Paste the resulting address into **Hosted photo URL** in the builder:

   ```
   https://thriveassetmx.github.io/thrive-email-signatures/people/firstname-lastname-square.png
   ```

Photos must be publicly reachable — mail clients fetch signature images over
plain HTTP with no login, so a private repo will not work.

## Why hosted rather than embedded

Without a hosted URL the builder embeds the photo directly in the HTML. That
pastes fine into Outlook, which stores the image alongside the signature, but
Gmail and some webmail strip embedded images. A hosted URL renders everywhere
and keeps the HTML small.

## Where the brand assets come from

Logos and icons are pulled live from
[`thrive-brand-book`](https://github.com/thriveassetmx/thrive-brand-book) —
this repo never copies them, so a logo update there flows through on its own.

All five company logos render at the **same 45px height**; the widths differ
because each lockup has its own proportions (2.85:1 to 3.34:1). The source
files are tightly trimmed with no padding, so equal height is equal
*optical* height.
