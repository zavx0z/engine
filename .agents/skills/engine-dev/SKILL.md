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
Stories render through the production renderer, remain bounded and
demand-driven, and work from the static `/engine/` base.

## Checks

Run the smallest focused test while iterating, then the applicable repository
checks:

```bash
bun run typecheck
bun run test:ci
bun run build
```

`bun run test:ci` is deterministic without a GPU. Use `bun run test` or
`bun run check` when real `bun-webgpu` pipeline and pixel-readback evidence is
required and a usable adapter is available. A green CPU/static build is not GPU
or visual proof.

## Storybook and evidence

Use the global `$storybook` with exact package `@engine/storybook` for
lifecycle, automatic origin, static build and browser evidence. This skill does
not own a Storybook process, port, registry, target, lifecycle script or shared
delivery rule. Engine package requirements retain only Engine-specific routes,
font ownership and GPU expectations.

Routes use pathname hierarchy. Overview routes end in `/`, exact leaves do
not, and unknown suffixes must return 404. The readiness marker is
`engineStorybook=ready`; visual evidence reads the exact
`#engine-story-canvas` and rejects a black result. The surrounding catalog is
the shared five-region Workbench, but its preview remains Engine-owned.

For a visual change, use `$storybook` to verify the exact story, WebGPU canvas, console, and a
non-black rendered result with the browser tooling available to the task. Keep
WebGPU Inspector external to source and build output. Performance claims need a
representative workload and recorded CPU, allocation/upload, draw/dispatch,
latency, frame, and memory evidence.

At handoff report the checkout and revision, focused and repository checks,
static build, exact live route where applicable, console/visual/GPU evidence,
and every remaining consumer or owner gate.
