# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static web app (no build step) with two tools:
- **Salary calculator** — computes after-tax income based on hours worked, hourly wage, and tax rate
- **Currency converter** — converts between currencies

Multi-language support is included.

## How to run

Open `index.html` directly in a browser. No server or build process needed.

## Files

- `index.html` / `script.js` — Salary calculator
- `currency.html` / `currency.js` — Currency converter
- `style.css` — Shared styling (Montserrat font via Google Fonts)
- `feedback.js` — User feedback handling
- `config.js` — Firebase configuration (credentials are embedded here)

## Notes

- Firebase is integrated (see `config.js`) but only used for feedback/analytics — not for core calculator logic
- All calculation logic is client-side JavaScript with no external dependencies
