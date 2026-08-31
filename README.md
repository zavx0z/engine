# Engine

**Built for [MetaFor](https://github.com/zavx0z/metafor). Designed as reusable WebGPU infrastructure for any immersive interface.**

[Architecture](./ARCHITECTURE.md) · [Contributing](./CONTRIBUTING.md)

Engine is a compact, retained WebGPU foundation for spatial applications. It owns scene transforms, geometry, materials, GPU resource management, rendering, picking, animation, loading, and view interaction. Product semantics stay outside the renderer, so the same primitives can support MetaFor, UI and Nodes as well as independent WebGPU applications.

The current core was migrated from the accepted `pkg/engine` implementation at MetaFor revision `df8f05e4c440386e10a6224fc15a2e66e7c961fe`. The repository history still contains the earlier standalone prototype; the working tree now reflects the accepted implementation.

## What it optimizes for

- WebGPU-only rendering with explicit GPU ownership.
- Retained `Object3D` transforms and inherited world matrices.
- Millimetre-based, right-handed, Z-up spatial coordinates.
- Demand-driven frames for interfaces that are often idle.
- Shared geometry, generation-safe instance layers, bounded partial uploads,
  and a shared-unit-quad `InstancedRoundedRect` storage/order pipeline.
- Analytical materials for common interface effects without texture or post-processing overhead.
- A single source-level package boundary that is reusable beyond MetaFor.

Engine is deliberately not a product framework. It does not own application state, domain entities, component semantics, or node-authoring policy.

Engine does own the Blender v5.2.0 Inter Regular default UI TTF as an optional
asset. Applications declare the URL they serve once in their HTML composition
root; the shared loader fetches it only when a runtime has not received another
font. Importing or installing `@engine/core` alone never requests the asset.
The previous JetBrains Mono Bold asset remains an explicit non-default subpath.

## Packages

| Package | Atom Material icon | Responsibility | Publication |
| --- | --- | --- | --- |
| `@engine/core` | `Memory` | Runtime scene graph, renderer, geometry, materials, math, loaders, animation and interaction | Internal |

The runtime workspace is `private: true`. External Storybook declarations are
development data, not a second npm workspace or production export.

## Storybook

The Storybook is a real browser-rendered catalog, not a collection of
screenshots. Every story constructs an `@engine/core` scene and renders it
through WebGPU. The project declaration lives at `.storybook/manifest.json`;
the package declaration, catalog and structural runtime live under
`packages/core/.storybook/`. Engine neither installs nor imports Storybook.

The five historical route suffixes are preserved exactly. Overview routes end
in `/`, exact leaves do not, and unknown suffixes return 404 instead of
selecting a fallback scene. One external server/origin supplies the shared
Workbench; each `@engine/core` tab gets one independently built package realm,
while its preview keeps the production Engine renderer and perspective camera.

Included stories cover:

- the Z-up millimetre coordinate contract;
- instanced geometry and shared GPU data;
- a one-pass holographic material;
- a one-pass thin-film material;
- retained rounded presentation clipping for text.

Each story has a lowercase semantic filename ending in `.stories.ts` and an
explicit Atom Material Icons association. JSON contains only literal
module/export references; the external compiler generates separate lazy
imports, so opening one route does not eagerly execute the other scenes.

## Repository map

| Repository | Role | Storybook / Pages |
| --- | --- | --- |
| [Engine](https://github.com/zavx0z/engine) | Reusable WebGPU infrastructure | External declaration |
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

Use one external Storybook server; package attach/open never starts another:

```bash
storybook serve /path/to/engine
storybook check /path/to/engine
storybook open @engine/core space/coordinate-system/z-up
storybook status
storybook stop
```

Useful commands:

```bash
bun run typecheck  # production and declaration-owned TypeScript contracts
bun run test       # CPU, shader, pipeline and declaration parity tests
bun run test:ci    # deterministic CPU/source tests for runners without a GPU
bun run check      # all checks in acceptance order
```

The full `bun run test` includes real WebGPU pipeline and pixel-readback tests
and therefore requires a usable GPU adapter. `bun run test:ci` remains the
deterministic non-GPU boundary; live package-tab evidence belongs to the
external server and is a separate acceptance step.

Generated external revisions remain tool-owned and are not written by Engine.
GitHub Pages remains manual and owner-gated; no workflow or deployment is
created by attaching this declaration.

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
