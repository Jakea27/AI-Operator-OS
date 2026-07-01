# Launch Instructions

Status: Draft  
Version: 0.1  
Owner: Jake Allen  
Last Updated: 2026-07-01

## Purpose

This document defines the reliable development launch path for AI Operator OS.

## Development Launch

During active development, use the root-level launcher:

`Launch-AI-Operator-OS.bat`

This launcher opens the repository `app` directory and runs:

`npm run dev`

Use this path when testing current source changes.

## Important Rule

Do not use old desktop shortcuts to test new source changes.

Desktop shortcuts may open an older installed or packaged build. That can make current source changes appear missing even when the code is correct.

## Packaged Builds

Installer and portable builds may be outdated until a fresh package is created with:

`npm run dist`

Packaged builds should be used for release verification, not as the default source-development launch path.

## Source of Truth

During active coding, the development launch is the source of truth.

If the development app and packaged app disagree, verify the Build Info and rebuild/repackage before assuming the source implementation failed.

