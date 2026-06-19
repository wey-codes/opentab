# OpenTab Spec

## Product Shape

OpenTab is a local-first new-tab launchpad. The main job is to make favorite links immediately clickable when a new tab opens.

## V1 Acceptance Criteria

- The first screen is only the link launchpad plus tiny controls for add/settings.
- Default links fill one viewport without scrolling on desktop and mobile.
- Link tiles are large, evenly sized, and easy to click.
- Link tiles show a favicon/logo preview with fallback initials.
- Users can edit, add, remove, export, import, and restore links.
- The page works as a static website without a build step.
- No account, backend, analytics, or browser permissions are required.
- No animated background, required onboarding, focus panel, routine widget, clock, or money counter in V1.

## Product Principles

- Links only.
- No required setup.
- Local by default.
- Useful before it is clever.

## Visual Spec

- Use a single full-screen grid, not a stacked dashboard.
- Keep cards coplanar: every link tile sits on the same visual level.
- Use 8px corner radius, subtle borders, and light shadows only for separation.
- Put the service icon first, then the link name, then the domain.
- Use each link accent sparingly as a top strip and soft wash, not as the whole card.
- Keep the default eight links visible on one screen with no scrolling.
- Avoid decorative gradients, 3D scenes, background art, or text explaining how the page works.

## Research Notes

- Material Design card guidance favors cards with one clear subject and obvious content hierarchy.
- Apple icon guidance favors memorable, recognizable-at-a-glance app marks.
- Nielsen Norman Group dashboard guidance favors single-screen, at-a-glance layouts that reduce extra scanning.
- X/Twitter bento-grid inspiration points toward orderly blocks and strong visual rhythm; OpenTab should borrow the order, not the busy showcase aesthetic.
