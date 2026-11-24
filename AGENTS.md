# Working in aurora

Cross-document requirements conflict engine — finds contradictions between separately-approved design documents, with line-level evidence trails.

## Run the tests

You need Node 22 or newer.

```bash
npm ci
npm run lint
npm test
```

Every test should pass before you start and after you finish.

## Where things are

- `src/`: the code
- `test/`: the tests
- `docs/`: written documentation
- `scripts/`: helper scripts, not part of the tool itself

## Before you commit

- Make sure the tests pass.
- Put changes people will notice in `CHANGELOG.md`.
- Do not put real passwords, keys or private data in test files or examples. Use made-up ones.
