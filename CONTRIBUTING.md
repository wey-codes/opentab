# Contributing

Thanks for considering a contribution to OpenTab.

The project is meant to stay small, useful, and easy to trust. Before adding features, ask whether the first screen still feels like a fast launcher.

## Local Setup

No install step is required.

```bash
python3 -m http.server 4174
```

Then open:

```text
http://127.0.0.1:4174/
```

## Checks

Run these before opening a pull request:

```bash
node --check app.js
python3 -m json.tool manifest.json >/dev/null
```

Also test the layout at desktop and mobile widths. The default eight tiles should fit on one screen without scrolling.

## Design Rules

- Keep the page local-first.
- Keep the first screen focused on links.
- Avoid required onboarding.
- Avoid accounts, analytics, and remote services.
- Make settings simple enough for non-technical users.
- Keep new features optional.

## Pull Requests

Small pull requests are easiest to review.

Good pull requests usually include:

- A clear description of the change.
- Screenshots for visual changes.
- Notes on desktop and mobile testing.
- Any privacy impact, especially if adding network requests or permissions.
