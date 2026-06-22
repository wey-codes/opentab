# OpenTab

OpenTab is a free, open-source new tab page for people who mostly want one thing: big, fast links to the sites they actually use.

It is a static, local-first Chrome new tab launcher. There is no account, backend, build step, analytics script, or sync service. Each person who installs it gets their own local copy and their own local settings.

![OpenTab screenshot](./docs/screenshot.jpg)

## Live Demo

OpenTab is live at [wey-codes.github.io/opentab](https://wey-codes.github.io/opentab/).

## What It Does

- Shows the link grid on one screen.
- Mirrors Chrome bookmarks into the center grid when installed as a Chrome extension.
- Keeps twelve fallback pinned links editable by the user.
- Shows frequent Chrome-history links in a bottom strip when installed as a Chrome extension.
- Shows a thin recent-history strip in extension mode.
- Keeps starter/favorite links visible in a bottom strip in mobile and static web mode.
- Refreshes Chrome history whenever the new tab page loads or becomes active.
- Works as plain static files, an installable mobile web app, or an unpacked Chrome extension.
- Stores settings locally in the current browser.

Default pinned links:

1. YouTube
2. Claude
3. OpenAI
4. Email
5. Calendar
6. Drive
7. Docs
8. X
9. Box
10. Facebook Ads
11. GitHub
12. Slack

## Install In Chrome

1. Download this repo as a ZIP, or clone it.
2. Unzip it if needed.
3. Open `chrome://extensions` in Chrome.
4. Turn on Developer Mode.
5. Click Load unpacked.
6. Choose the `opentab` folder.
7. Open a new tab.

Chrome may show that OpenTab can read browsing history and bookmarks. OpenTab uses those permissions only inside your browser to fill the recent strip, choose the center bookmark grid, and fill the bottom frequent-links strip. It checks history and bookmarks on load and again when the tab becomes active. Nothing is sent to a server because there is no server.

## Use Without Installing An Extension

Open `index.html` directly in a browser, or serve the folder with any static file server.

```text
file:///path/to/opentab/index.html
```

The plain file/static version cannot read Chrome history or bookmarks, so it does not know your actual most-used sites or bookmark tree. It keeps the top strip and bottom strip visible with local OpenTab clicks plus starter links. A hosted URL opened through a new-tab redirect extension has the same browser limit. To use real browser history and bookmark mirroring, install OpenTab itself as the Chrome extension.

## Install On Mobile

Host OpenTab on any static host with HTTPS, then open that URL on your phone.

On iPhone:

1. Open the hosted OpenTab URL in Safari.
2. Tap Share.
3. Tap Add to Home Screen.

On Android:

1. Open the hosted OpenTab URL in Chrome.
2. Tap the menu.
3. Tap Add to Home screen or Install app.

The mobile web app is a fast home-screen launcher for pinned links. Mobile Chrome does not allow this page to read browser history, so OpenTab uses local OpenTab clicks plus starter links for the top and bottom strips. Real browser-history strips remain desktop-extension-only.

## Customize

Use the settings button in the top right to edit pinned links, add links, restore defaults, import, or export your config.

Your custom links are stored locally in your browser. They are not part of this repo and are not shared with other people.

## Privacy

OpenTab is intentionally small and local-first:

- No account
- No backend
- No analytics
- No tracking pixels
- No bundled third-party scripts
- No shared database

See [PRIVACY.md](./PRIVACY.md) for the full plain-English privacy note.

## Publish Your Own Copy

This folder can be deployed as-is to GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any static host.

If you host it as a website, people can install it to a phone home screen or use the URL with a new tab redirect extension. If you want Chrome to replace the desktop new tab page directly and read Chrome history, use the unpacked extension install flow above.

## Development

OpenTab is just HTML, CSS, and JavaScript.

```bash
python3 -m http.server 4174
```

Then open:

```text
http://127.0.0.1:4174/
```

Useful checks:

```bash
node --check app.js
python3 -m json.tool manifest.json >/dev/null
python3 -m json.tool site.webmanifest >/dev/null
```

## Project Direction

OpenTab should stay simple. The goal is a launchpad, not a dashboard.

Good ideas:

- Better link editing
- Drag to reorder links
- Theme picker
- Keyboard shortcuts
- Cleaner extension packaging

Ideas to be careful with:

- Required onboarding
- Accounts or sync
- Habit tracking
- Complex widgets
- Anything that makes the first screen slower to understand

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

## License

MIT. See [LICENSE](./LICENSE).
