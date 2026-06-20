# OpenTab Spec

## Product Shape

OpenTab is a local-first new-tab launchpad. The main job is to make pinned links immediately clickable while letting a couple of high-use sites surface automatically.

## V1 Acceptance Criteria

- The first screen is only the link launchpad plus tiny controls for add/settings.
- Default links fill one viewport without scrolling on desktop and mobile.
- The default big grid is five pinned links plus two smart frequent-history slots.
- Installed extension mode can show real Chrome history in a thin top strip using the `history` permission.
- Plain file/static mode keeps a recent OpenTab-click fallback without browser-history access.
- Link tiles are large, evenly sized, and easy to click.
- Link tiles show a favicon/logo preview with fallback initials.
- Users can edit, add, remove, export, import, and restore links.
- The page works as a static website without a build step.
- The folder can be loaded as an unpacked Chrome extension that overrides the new tab page.
- No account, backend, or analytics are required. Extension mode uses Chrome's `history` permission only for the history strip.
- No animated background, required onboarding, focus panel, routine widget, clock, or money counter in V1.

## Product Principles

- Links only.
- No required setup.
- Local by default.
- Useful before it is clever.

## Visual Spec

- Use a single full-screen grid, not a stacked dashboard.
- Keep cards coplanar: every link tile sits on the same visual level.
- Use paper-like surfaces, black ink borders, and offset shadows for separation.
- Put the service icon first, then the link name, then the domain.
- Use each link accent only as a soft paper wash behind the icon area, not as the whole card.
- Keep the default eight links visible on one screen with no scrolling.
- Avoid 3D scenes, glossy effects, bright white glare, or text explaining how the page works.

## Research Notes

- Material Design card guidance favors cards with one clear subject and obvious content hierarchy.
- Apple icon guidance favors memorable, recognizable-at-a-glance app marks.
- Nielsen Norman Group dashboard guidance favors single-screen, at-a-glance layouts that reduce extra scanning.
- X/Twitter bento-grid inspiration points toward orderly blocks and strong visual rhythm; OpenTab should borrow the order, not the busy showcase aesthetic.
