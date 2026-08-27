# Engine

**Built for [MetaFor](https://github.com/zavx0z/metafor). Designed as reusable WebGPU infrastructure for any immersive interface.**

[Live WebGPU Storybook](https://zavx0z.github.io/engine/) · [Architecture](./ARCHITECTURE.md) · [Contributing](./CONTRIBUTING.md)

Engine is a compact, retained WebGPU foundation for spatial applications. It owns scene transforms, geometry, materials, GPU resource management, rendering, picking, animation, loading, and view interaction. Product semantics stay outside the renderer, so the same primitives can support MetaFor, UI and Nodes as well as independent WebGPU applications.

The current core was migrated from the accepted `pkg/engine` implementation at MetaFor revision `df8f05e4c440386e10a6224fc15a2e66e7c961fe`. The repository history still contains the earlier standalone prototype; the working tree now reflects the accepted implementation.

## What it optimizes for

- WebGPU-only rendering with explicit GPU ownership.
- Retained `Object3D` transforms and inherited world matrices.
- Millimetre-based, right-handed, Z-up spatial coordinates.
- Demand-driven frames for interfaces that are often idle.
- Shared geometry, instancing, frustum culling, and bounded uploads.
- Analytical materials for common interface effects without texture or post-processing overhead.
- A single source-level package boundary that is reusable beyond MetaFor.

Engine is deliberately not a product framework. It does not own application state, domain entities, component semantics, or node-authoring policy.

Engine does own the default project TTF as an optional asset. Applications
declare the URL they serve once in their HTML composition root; the shared
loader fetches it only when a runtime has not received another font. Importing
or installing `@engine/core` alone never requests the asset.

## Packages

| Package | Atom Material icon | Responsibility | Publication |
| --- | --- | --- | --- |
| `@engine/core` | `Memory` | Runtime scene graph, renderer, geometry, materials, math, loaders, animation and interaction | Internal |
| `@engine/storybook` | `AutoStories` | Static live WebGPU stories and repository documentation surface | Internal |

Both workspaces are `private: true`. Internal means that no package is automatically published to a registry; it does not prevent source reuse under the repository license.

## Storybook

The Storybook is a real browser-rendered catalog, not a collection of
screenshots. Every story constructs an `@engine/core` scene and renders it
through WebGPU. Core-owned descriptors live under `packages/core/storybook/**`;
the private repository app composes them through exact
`@zavx0z/storybook/*` subpaths.

Navigation uses pathname routes below `/engine/`. Overview routes end in `/`,
exact leaves do not, and unknown suffixes return 404 instead of selecting a
fallback scene. The shared five-region Workbench provides Russian navigation,
source, Copy, controls and events while the preview keeps its own production
Engine renderer and perspective camera.

Included stories cover:

- the Z-up millimetre coordinate contract;
- instanced geometry and shared GPU data;
- a one-pass holographic material;
- a one-pass thin-film material.

Each story has a lowercase semantic filename ending in `.stories.ts` and an
explicit Atom Material Icons association. Story implementations load through
separate dynamic imports, so opening one route does not eagerly execute the
other scenes.

## Repository map

| Repository | Role | Storybook / Pages |
| --- | --- | --- |
| [Engine](https://github.com/zavx0z/engine) | Reusable WebGPU infrastructure | [Engine Storybook](https://zavx0z.github.io/engine/) |
| [Renderer](https://github.com/zavx0z/renderer) | Standard DOM, CSS/layout/display projection and retained WebGPU realization | Repository-owned checks |
| [UI](https://github.com/zavx0z/ui) | DOM/CSS controls and interface composition | [planned UI Pages](https://zavx0z.github.io/ui/) |
| [Node](https://github.com/zavx0z/node) | Node editor, layout and authoring surfaces | [Node Storybook](https://zavx0z.github.io/node/) |
| [MetaFor](https://github.com/zavx0z/metafor) | Product integration and immersive domain projections | Product-owned surfaces |

The live document path has one owner chain: `@zavx0z/dom` →
`@zavx0z/renderer` → `@zavx0z/renderer-webgpu` → `@engine/core`. Generic
Layout and `@ui/elements` are retired; the Node-owned `@nodes/layout` domain
package remains independent of that retired runtime.

## Requirements

- [Bun](https://bun.sh/) `1.4.0`
- A browser with WebGPU enabled for the live Storybook
- A platform supported by `bun-webgpu` for GPU pipeline tests

## Development

```bash
bun install
bun run check
```

Use `$storybook ensure @engine/storybook` for the no-HMR runtime and
`$storybook check @engine/storybook` for its package gates. The browser page is
compiled once on its first request and remains stable until the exact owned
process is restarted.

Useful commands:

```bash
bun run typecheck  # core and Storybook TypeScript contracts
bun run test       # CPU, shader, pipeline and catalog tests
bun run test:ci    # deterministic CPU/source tests for runners without a GPU
bun run check      # all checks in acceptance order
```

The full `bun run test` includes real WebGPU pipeline and pixel-readback tests and therefore requires a usable GPU adapter. GitHub Pages CI runs the deterministic CPU/source suite plus the static browser build; a green Pages workflow is not presented as GPU-rendering proof.

Generated `dist/` files are intentionally ignored. The static builder writes a
schema-1 manifest with exact dependency revisions, routes, lazy chunks, sizes
and SHA-256 hashes. GitHub Pages remains manual and owner-gated; its cold
workflow must use immutable delivered revisions for shared Storybook, Renderer,
UI and Highlighter before it may be dispatched.

## Consuming the core locally

Sibling repositories can use `@engine/core` through an exact immutable dependency. During coordinated local development, a Bun link may temporarily replace that resolved dependency:

```bash
cd packages/core
bun link

cd /path/to/consumer
bun link --no-save @engine/core
```

Do not commit a global link as dependency evidence. CI and accepted revisions must resolve from a reproducible version, tarball, or commit-backed artifact.

## Contract

The compact engine-level invariants live in [`packages/core/contract.md`](./packages/core/contract.md). Architectural ownership and cross-package direction live in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## License

[MIT](./LICENSE)
