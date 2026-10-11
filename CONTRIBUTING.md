# Contributing

```bash
pnpm install
pnpm dev          # builds the package, then runs the site on http://localhost:3000
```

- `packages/moodi` — the library (`pnpm --filter moodi dev` rebuilds on change)
- `apps/site` — the Next.js demo site; `/lab` renders every shape × mood

Before opening a pull request:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Keep the core small (the gzip budget is 25 kB, three.js excluded) and check
`/lab` in both themes. Design decisions live in `DECISIONS.md`.
