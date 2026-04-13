# @zicenter/resource-kit

Headless, framework-agnostic toolkit for building data-driven admin UIs. Define a `ResourceDefinition` and get list/detail/form pages, slots, tabs, actions, and search — without writing plumbing.

## Install

This package is consumed as a git-based npm dependency:

```json
{
  "dependencies": {
    "@zicenter/resource-kit": "github:ZiCenter/resource-kit#main"
  }
}
```

`pnpm install` clones the repo and runs `prepare` (which runs `tsup`), so consumers always resolve against built output in `dist/`.

Depends on [`@zicenter/form-kit`](https://github.com/ZiCenter/form-kit), which is resolved the same way.

## Entry points

- `@zicenter/resource-kit` — primary API
- `@zicenter/resource-kit/errors` — `AppError`, `ValidationError`, `AuthenticationError`
- `@zicenter/resource-kit/auth-types` — `CoreAuthUser` and related types
- `@zicenter/resource-kit/i18n/provider` — i18n provider

## Peer dependencies

React 19, React Router 7, React Hook Form 7, TanStack Query 5, TanStack Table 8, axios, zod 4, date-fns, i18next, react-i18next.

## Design docs

See `system-design.md` and `contributor-guide.md` in this repo for the architecture deep-dive.

## License

UNLICENSED (internal ZiCenter package).
