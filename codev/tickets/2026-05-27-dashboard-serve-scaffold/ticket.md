# Archived Ticket: Scaffold Local Dashboard Server

> **Date**: 2026-05-27
> **Final Status**: Completed

## Scope

Add a first `codev serve` dashboard that scans a project folder, separates child folders from Markdown files, renders selected Markdown, and allows editing existing `.md` files through the local server.

## Decisions

- Use Node core modules only.
- Keep the dashboard browser UI as plain HTML/CSS/JS.
- Keep Markdown as the source of truth.
- Bind the local server to `127.0.0.1`.
- Allow writes only to existing `.md` files inside the served project root.

## Changes

- Added `serve` command to `index.js`.
- Added local scan/read/write APIs.
- Added static dashboard assets under `dashboard/`.
- Updated package file inclusion and README usage.
- Updated CODEV architecture and folder structure knowledge.

## Risks

- Markdown rendering is intentionally minimal and does not support the full Markdown spec.
- The first editor flow overwrites the whole selected Markdown file on save.
