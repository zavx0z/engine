---
name: engine-dev
description: "Develop and verify the standalone Engine repository, @engine/core, WebGPU contracts, tests, and static Storybook. Use for Engine implementation or repository-level development; use consumer-owned skills for UI, Nodes, or MetaFor integration."
---

# Engine development

Built for [MetaFor](https://github.com/zavx0z/metafor) as reusable WebGPU
infrastructure for immersive interfaces.

Use the exact Engine checkout supplied for the task. Preserve its branch or
detached HEAD, unrelated changes, listeners, and browser targets. Before
changing a contract, read `ARCHITECTURE.md`, `packages/core/contract.md`, the
affected public types and implementation, and focused tests.

`@engine/core` owns retained scene transforms, geometry, materials, WebGPU
resources and pipelines, loading, picking, animation, `Space`, and `ViewPoint`.
It does not own product state, visual controls, node authoring, or MetaFor domain
semantics. Do not add reverse dependencies, compatibility aliases, duplicate
barrels, or imports from consumer repositories. Storybook consumes only the
public `@engine/core` boundary.

Engine owns the optional default TTF and the exact
`@engine/core/default-font` loader. The main entrypoint remains asset-free. A
browser composition root declares one meta URL; package code must not copy the
font, invent another default route, or fetch it eagerly. Custom runtime fonts
bypass the document default.

All directories and filenames are lowercase; multiword filenames use
kebab-case. Tests end in `.test.ts` and live catalog entries in `.stories.ts`.
Stories render through the production renderer and remain bounded and
demand-driven. Their exact legacy route suffixes remain declaration data.

## Checks

Run the smallest focused test while iterating, then the applicable repository
checks:

```bash
bun run typecheck
bun run test:ci
storybook check /path/to/engine
```

`bun run test:ci` is deterministic without a GPU. Use `bun run test` or
`bun run check` when real `bun-webgpu` pipeline and pixel-readback evidence is
required and a usable adapter is available. A green CPU/package build is not GPU
or visual proof.

## Storybook and evidence

Engine does not install Storybook and owns no Storybook process, port, build or
lifecycle wrapper. The repository declaration is `.storybook/manifest.json`;
the `@engine/core` catalog, runtime adapter and package overview are under
`packages/core/.storybook/`. Use the external global tool as one server:

```bash
storybook serve /path/to/engine
storybook attach /path/to/engine
storybook check /path/to/engine
storybook open @engine/core space/coordinate-system/z-up
storybook status
storybook stop
```

If the server already exists, `attach` and `open` reuse it. Ports, process
selectors and per-package lifecycle are never Engine-facing identities.

Routes use pathname hierarchy. Overview routes end in `/`, exact leaves do
not, and unknown suffixes must return 404. Visual evidence reads the exact
Engine-owned `#engine-story-canvas` inside the shared package tab and rejects a
black result. The external shared Workbench owns navigation and diagnostics;
the preview canvas, production Renderer and perspective camera remain Engine-owned.

For a visual change, use the external Storybook to verify the exact story, WebGPU canvas, console, and a
non-black rendered result with the browser tooling available to the task. Keep
WebGPU Inspector external to source and build output. Performance claims need a
representative workload and recorded CPU, allocation/upload, draw/dispatch,
latency, frame, and memory evidence.

At handoff report the checkout and revision, focused and repository checks,
external package check, exact live route where applicable, console/visual/GPU evidence,
and every remaining consumer or owner gate.
