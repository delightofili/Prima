# Prima landing page

A small static website: no framework, no packages, no tracking. It loads in about 14 KB compressed.

## The three things you do

1. Fill in `site.config.json` (your address, WhatsApp, LinkedIn, email, launch time).
2. `node build.mjs` builds the finished site into `dist/`. `node check.mjs` checks it.
3. Deploy the `dist` folder to Cloudflare Pages.

## site.config.json

| Field | What to put | If you leave it empty |
|---|---|---|
| `domain` | The address people will use, with `https://` and no slash at the end | Required |
| `whatsapp` | Your number, in any usual style (`0803 123 4567` or `+234 803 123 4567`) | The WhatsApp button is hidden |
| `linkedin` | Your LinkedIn profile address, starting `https://` | The LinkedIn button is hidden |
| `contactEmail` | An email address people can write to | The email button is hidden |
| `launchAt` | When the pilot opens, with a time zone, e.g. `2026-11-05T09:00:00+01:00` (Lagos is +01:00) | No countdown is shown |
| `waitlistOpens` | A few words, e.g. `on Monday 2 November` | It says "in a few days" |

At least one of WhatsApp, LinkedIn or email must be set, or `check.mjs` stops the deploy: the waitlist section would have no way to reach you.

## Commands

    node build.mjs        build into dist/
    node check.mjs        check dist/ (stops a deploy if something is wrong)
    node --test           run the automated tests

## Changing the words

The page text is in `src/index.html`, the look is in `src/assets/styles.css`, and the small amount of script is in `src/assets/app.js`. Edit them, run `node build.mjs`, and look at `dist/index.html` in a browser.

## Adding real pictures later

The hero phone and the step pictures are drawn in code, so they are tiny and sharp. To use real screenshots or photos: put the images in `src/assets/`, save them as WebP (about 80 KB each), and add `<img src="/assets/name.webp" alt="what it shows" width="800" height="600" loading="lazy">` (always with `alt`, `width`, `height`). `check.mjs` complains if any of the three is missing. Never use a photo of a real patient or a real clinic without written permission.

## Icons

Icons come from Lucide (ISC licence), pasted into `src/assets/sprite.svg` and inlined into the page by the build.

## Security policy

`src/_headers` allows only this site's own files, plus the one small inline script by its fingerprint. When the waitlist form arrives (Day 21), `connect-src` and `form-action` there must also allow your Supabase address.
