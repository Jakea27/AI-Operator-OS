# AI Operator OS

AI Operator OS is a local-first AI business operating system designed to help one owner run AI-powered businesses while keeping human approval over important decisions.

## Current Version

0.1.0-alpha

## Desktop Application

The desktop command center lives in `app/` and is built with Electron, React, Vite, TypeScript, and Tailwind CSS.

```bash
cd app
npm install
npm run dev
```

The application includes dedicated workspaces for Dashboard, CEO, Money, Development, Memory, Roadmap, Operators, Approval Queue, and Settings. Workspace state is persisted locally on the device.

## Windows Release Builds

From the `app` directory:

```bash
npm install
npm run build
npm run dist
```

`npm run dist` creates both a guided Windows installer and a portable executable in `app/release/`.

Additional release commands:

```bash
npm run dist:installer
npm run dist:portable
```

The installer creates shortcuts on the desktop and in the Start Menu. Windows builds are currently produced for x64.

## North Star

Maximize owner profit while minimizing owner time.

## Start Here

1. Read `docs/PROJECT_CONTEXT/00_START_HERE.md` for the permanent session handoff.
2. Read `docs/VISION.md`
3. Read `docs/ARCHITECTURE.md`
4. Review `docs/ROADMAP.md`
5. Review `docs/FUTURE_IDEAS.md` for ideas intentionally kept off the active roadmap
6. Review `docs/TECH_DEBT.md` for deferred refactoring and engineering debt
7. Review `docs/POLISH_BACKLOG.md` for deferred UI/UX polish work
8. Continue development through issues and sprints

## Project Context Handoff

Future ChatGPT/Codex sessions should begin with `docs/PROJECT_CONTEXT/00_START_HERE.md`. The `docs/PROJECT_CONTEXT/` folder contains the current status, next milestone, build workflow, testing checklist, development playbook, common pitfalls, lessons learned, project metrics, and a reusable Codex prompt template.
