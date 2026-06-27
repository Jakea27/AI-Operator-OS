# Build Workflow

## Install

From `app/`:

```bash
npm install
```

## Development

From `app/`:

```bash
npm run dev
```

The development workflow builds and previews the app, then launches Electron.

## Production Build

From `app/`:

```bash
npm run build
```

This runs TypeScript validation and Vite production build.

## Windows Packaging

From `app/`:

```bash
npm run dist
```

This creates:

- `app/release/win-unpacked/AI Operator OS.exe`
- Windows installer `.exe`
- Portable `.exe`

## Packaged App Verification

Launch:

```text
app/release/win-unpacked/AI Operator OS.exe
```

Then open Settings and check Build Info:

- App version
- Build timestamp
- Build mode
- Frontend bundle filename
- Bundle hash
- Sidebar footer version/hash

If the running app does not match source, compare the visible Build Info hash with `app/dist/index.html`.

## Common Build Issue

If `npm run dist` fails with access denied on `AI Operator OS.exe`, an old packaged executable may be locked. Close all running packaged app windows, verify no `AI Operator OS` process is running, then rerun `npm run dist`.

