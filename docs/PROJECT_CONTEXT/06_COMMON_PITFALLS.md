# Common Pitfalls

## Duplicate Code Paths

The project has active pages under `app/pages` and feature modules under `app/src/features`. Always confirm the router import before editing.

Active examples:

- Settings page: `app/pages/Settings.tsx`
- Shell/sidebar: `app/components/AppShell.tsx`
- Router: `app/src/App.tsx`

## Stale Packaged App

The packaged app can be older than source and `app/dist`. If the UI does not match source:

1. Run `npm run build`.
2. Run `npm run dist`.
3. Launch `app/release/win-unpacked/AI Operator OS.exe`.
4. Check Settings → Build Info.

Do not assume a feature failed until the packaged app hash is verified.

## Build Verification Trap

Localhost can show a different app than the packaged Windows executable. Vite dev, Vite preview, `app/dist`, `win-unpacked`, and the installed app can each be at a different build age.

For desktop behavior, verify the packaged app:

1. Run `npm run build`.
2. Run `npm run dist`.
3. Launch `app/release/win-unpacked/AI Operator OS.exe`.
4. Check Settings → Build Info.

## Separate LocalStorage Origins

Development preview and packaged Electron can have separate localStorage datasets. Data entered in one environment may not appear in another.

## Incremental Changes

Large rewrites create hidden regressions. Prefer small, verified changes that extend the active code path. After each meaningful change, confirm the route, build, and visible UI before continuing.

## Source of Truth

The GitHub repository and local working tree are the source of truth. The packaged application is a build artifact and can be stale. GitHub Desktop is used for review, commit, and push.

## Scope Creep

Do not add adjacent features just because they are useful. Finish the requested milestone, update documentation, run verification, and stop for CEO review.

## Grid Auto-Placement

Tailwind grid layout can visually place cards differently than source order when there are open grid slots. For exact visual placement, inspect the rendered app or use full-width `col-span-12` sections.

## Approval State Drift

Recommendations and approvals must stay synchronized by shared IDs. Linked approval status should be treated as source of truth for CEO decision display.

## Cosmetic Drift

If a request is purely visual polish, document future work in `docs/POLISH_BACKLOG.md` unless the CEO explicitly asks to implement it now.
