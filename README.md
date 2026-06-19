# OpenTab

OpenTab is a simple open-source new-tab launchpad: large, even favorite-link tiles that fill one screen.

It is intentionally static. No account, backend, build step, analytics, or sync service is required.

## Use It Locally

Open `index.html` in Chrome, or serve the folder with any static file server.

For New Tab Redirect, use the file URL for your local copy:

```text
file:///path/to/opentab/index.html
```

## Features

- Full-screen favorite-link grid
- Large equal tiles with favicon/logo previews
- Automatic favicon fallback for custom links
- In-page link editing
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

OpenTab stores links locally in the browser. Link icons are loaded from each site's favicon or a favicon lookup URL so the tiles look recognizable without bundling trademarked logo assets into the repo.

## Roadmap Ideas

- Drag to reorder links
- Keyboard shortcuts
- Optional Chrome extension wrapper
- Theme picker
- Better per-link color controls

## License

MIT. See [LICENSE](./LICENSE).
