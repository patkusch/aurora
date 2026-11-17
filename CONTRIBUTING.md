# Adding to aurora

Small, focused changes are welcome. Open an issue first for anything large, so nobody builds what will not be merged.

## Before you push

```bash
npm ci
npm run lint
npm test
npm run check:corpus
npm run build
```

Push only when all of it passes. Never pipe the test output into something that hides a failure.

## What every change comes with

- A test that fails without the change and passes with it.
- The sample documents in the corpus are made up. Never add a real organisation's documents.
- Plain English in anything a person reads: say what it does and why, and put the plain meaning next to every number.
- No invented figures. A number in the README comes from a run you can repeat, and a result that showed no benefit still goes in.
