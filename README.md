# 48-Hour Refresh

Installable PWA for 48-Hour Refresh: AI-assisted social posts, menu designs, and ad creatives / short motion graphics for Long Island businesses, with a 48-hour turnaround.

Static HTML/CSS/JS with no build step. It's hosted free on GitHub Pages.

## Receiving form submissions
Open `app.js` and edit the two constants at the top:
- `CONTACT_EMAIL`: your inbox. The `mailto:` fallback opens the visitor's email app with this address and the request filled in.
- `FORM_ENDPOINT`: optional free endpoint that emails you automatically:
  - FormSubmit: `https://formsubmit.co/ajax/YOUR_EMAIL` (no account; confirm the activation email after the first submission), or
  - Formspree free tier: `https://formspree.io/f/YOUR_ID`.

Every request is also saved on the visitor's device (localStorage).

When you change cached files, bump `CACHE` in `sw.js`.
