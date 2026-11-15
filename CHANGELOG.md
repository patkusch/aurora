# Changelog

What changed and when, newest first. This project does not have numbered releases, so the entries are grouped by month.

## 2026-10

- Dependencies updated within their allowed ranges, except the Gemini client. The README now says Node 22 or later, not 18+.

## 2026-09

- The local Gemma path for the first pass now runs. It was tested on gemma3 4B and then on gemma3 12B, and the results are in the README.
- Tests for the verifier, which found and fixed two defects.
- A security fix for `qs` (through express) and a Docker base image moved off Node 20, which has reached end of life.
- The README points to HAZLOG, the successor build.

## 2026-08

- First version: finds contradictions between separately approved design documents and shows the exact lines.
- Provenance of the first pass is verified and finding IDs stay stable between runs. The README states what verification proves and what it does not.
- The app can be deployed to any host; a single-page-app fallback bug (Express 4 versus 5) was fixed.
