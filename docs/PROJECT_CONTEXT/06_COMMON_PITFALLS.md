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

## Separate LocalStorage Origins

Development preview and packaged Electron can have separate localStorage datasets. Data entered in one environment may not appear in another.

## Grid Auto-Placement

Tailwind grid layout can visually place cards differently than source order when there are open grid slots. For exact visual placement, inspect the rendered app or use full-width `col-span-12` sections.

## Approval State Drift

Recommendations and approvals must stay synchronized by shared IDs. Linked approval status should be treated as source of truth for CEO decision display.

## Cosmetic Drift

If a request is purely visual polish, document future work in `docs/POLISH_BACKLOG.md` unless the CEO explicitly asks to implement it now.

