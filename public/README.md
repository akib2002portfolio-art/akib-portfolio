# Akib Al Imran — Favicon / logo pack

A bold "A" monogram (cyan → violet gradient) on a dark rounded square,
designed to stay legible even at 16px in a browser tab.

## Files
- favicon.ico — multi-size (16/32/48) for classic browser tab support
- favicon.svg — scalable source, best for modern browsers
- favicon-16x16.png / favicon-32x32.png — standard sizes
- apple-touch-icon.png (180x180) — iOS home screen icon
- android-chrome-192x192.png / android-chrome-512x512.png — Android/PWA icons

## Where to put them
This is a Vite/React project (based on your repo structure). Drop all files into:

    public/

replacing the existing favicon there.

## HTML to add
In `index.html`, inside `<head>`, replace any existing favicon `<link>` tags with:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="shortcut icon" href="/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

(Optional, for PWA/Android home screen support, add a `site.webmanifest` referencing
`android-chrome-192x192.png` and `android-chrome-512x512.png`.)

## Deploy
Commit the files + index.html change, push to GitHub, and Vercel will redeploy
automatically. Browsers cache favicons aggressively — do a hard refresh
(Ctrl/Cmd+Shift+R) or open in an incognito window to see it update.
