# OpenTab

OpenTab is a simple open-source start page for new tabs: big favorite links first, with a light daily focus box, one routine checklist, and a small hourly earnings counter.

It is intentionally static. No account, backend, build step, analytics, or sync service is required.

## Use It Locally

Open `index.html` in Chrome, or serve the folder with any static file server.

For New Tab Redirect, use the file URL for your local copy:

```text
file:///path/to/opentab/index.html
```

## Features

- Large launch tiles for favorite links
- Optional daily focus field
- One simple routine checklist
- Hourly wage counter for money earned today
- Local settings saved in the browser
- Config export/import as JSON
- Static hosting friendly
- Local Three.js background in `vendor/three.min.js`

## Publish It

This folder can be deployed as-is to GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any static host.

For GitHub Pages:

1. Put these files in a GitHub repo.
2. Enable Pages for the repo.
3. Use the published URL in a browser new-tab redirect extension.

## Privacy

OpenTab only uses the local time/date and the data typed into the page. It does not read browser history, email, calendar, files, or activity from other apps.

Future Chrome extension support could optionally suggest top sites, but that should stay opt-in because it requires browser permissions.

## Roadmap Ideas

- Drag to reorder links
- Keyboard search/filter
- Optional Chrome extension wrapper
- Optional top-sites suggestions
- Simple theme picker
- Better icon handling

## License

MIT. See [LICENSE](./LICENSE).
