# Contributing to Engine

**Engine is built for [MetaFor](https://github.com/zavx0z/metafor) and maintained as reusable WebGPU infrastructure.**

Changes should preserve that two-part promise: MetaFor receives a focused high-performance foundation, while Core remains free of product-specific semantics.

## Setup

Requirements:

- Bun `1.4.0` from [`.bun-version`](./.bun-version)
- a WebGPU-capable browser for live story verification
- a platform supported by `bun-webgpu` for GPU tests

```bash
bun install
bun run check
```

Run the live catalog with:

```bash
bun run dev
```

Open `http://127.0.0.1:4173/engine/`.

## Working boundaries

- `packages/core` owns reusable rendering infrastructure only.
- `packages/storybook` consumes the public `@engine/core` entrypoint.
- UI controls belong in [UI](https://github.com/zavx0z/ui).
- Node authoring and layout belong in [Node](https://github.com/zavx0z/node).
- MetaFor domain and product policy belong in [MetaFor](https://github.com/zavx0z/metafor).

Do not add a reverse dependency from Engine to a consumer repository. If a feature only makes sense for one product surface, adapt it in that owner first.

## Naming

- Directories and filenames are lowercase.
- Multiword files use kebab-case: `thin-film-material.ts`.
- Unit, source-contract, and pipeline tests end in `.test.ts`.
- Live catalog entries end in `.stories.ts`.
- A story declares a semantic Atom Material Icons association and uses the local icon set.
- Public TypeScript symbols retain conventional PascalCase where appropriate.

Avoid compatibility aliases or duplicate barrels. Import from the real owner and keep the root public surface deliberate.

## Core changes

Before changing Core:

1. Read [`packages/core/contract.md`](./packages/core/contract.md).
2. Identify the public symbol, renderer path, shader, and consumers affected.
3. Add or update the smallest owner test.
4. Add a Storybook story only when a visual contract benefits from direct inspection.
5. Run the complete acceptance sequence.

Core production code has no external package dependencies. Adding one changes the runtime boundary and requires an explicit architecture decision.

## Story requirements

A useful story:

- imports only from `@engine/core`;
- builds one bounded scene that demonstrates a real contract;
- renders through the production `Renderer`;
- supplies a camera preset, concise source sample, tags, and source path;
- works from the static `/engine/` project base;
- does not use a screenshot as a substitute for live output;
- remains legible when WebGPU is unavailable by exposing metadata and an error state.

Stories render on demand. Do not introduce an unconditional animation loop for a static contract.

## Tests and checks

```bash
bun run typecheck
bun run test
bun run build
git diff --check
```

`bun run check` runs the first three in order. The WebGPU pipeline tests compile and execute shaders with `bun-webgpu`; they are not string-only placeholders.

Before handing off a visual change, also inspect the live story in a WebGPU browser and check the console. A successful static build does not prove visual correctness.

## Generated output

Do not commit `dist/`, dependency directories, logs, or local environment files. GitHub Actions builds the Pages artifact from `bun.lock` with `bun install --frozen-lockfile`.

The workflow deploys only after checks pass. Enabling Pages, changing repository settings, publishing packages, or updating sibling consumers are separate owner-controlled actions.

## Cross-repository delivery

When an Engine change is needed by UI, Nodes, or MetaFor:

1. land and verify the Engine revision;
2. produce a reproducible dependency reference;
3. update the lowest dependent repository;
4. continue upward one owner at a time;
5. use local `bun link --no-save` only as a temporary development overlay.

Do not present a global link as accepted dependency evidence.
