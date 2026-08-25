# Engine agent rules

- Use `$engine-dev` from `.agents/skills/engine-dev` for Engine implementation,
  tests, Storybook work, static Pages builds, browser verification, and GPU
  evidence.
- Read `ARCHITECTURE.md`, the affected public contract, implementation, and
  focused tests before changing behavior.
- Keep product, UI-control, node-authoring, and MetaFor domain semantics out of
  `@engine/core`. Dependencies point toward Engine, never from Engine to a
  consumer repository.
- Preserve the supplied checkout, unrelated changes, listeners, and browser
  targets. Publishing packages, changing Pages settings, or updating consumers
  requires an explicit request.
