---
name: engine-dev
description: "Develop and verify the standalone Engine repository, @engine/core, WebGPU contracts, and tests. Use for Engine implementation or repository-level development; use consumer-owned skills for UI, Nodes, or MetaFor integration."
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
barrels, or imports from consumer repositories.

Engine owns the optional default TTF and the exact
`@engine/core/default-font` loader. The main entrypoint remains asset-free. A
browser composition root declares one meta URL; package code must not copy the
font, invent another default route, or fetch it eagerly. Custom runtime fonts
bypass the document default.

All directories and filenames are lowercase; multiword filenames use
kebab-case. Tests end in `.test.ts`.

## Checks

Run the smallest focused test while iterating, then the applicable repository
checks:

```bash
bun run typecheck
bun run test:ci
```

`bun run test:ci` is deterministic without a GPU. Use `bun run test` or
`bun run check` when real `bun-webgpu` pipeline and pixel-readback evidence is
required and a usable adapter is available. A green CPU check is not GPU proof.

Keep WebGPU Inspector external to source and build output. Performance claims
need a representative workload and recorded CPU, allocation/upload,
draw/dispatch, latency, frame, and memory evidence.

At handoff report the checkout and revision, focused and repository checks,
GPU evidence where applicable, and every remaining consumer or owner gate.
