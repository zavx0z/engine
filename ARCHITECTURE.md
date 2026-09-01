# Engine architecture

**Built for [MetaFor](https://github.com/zavx0z/metafor), while preserving a reusable WebGPU core for other immersive applications.**

## Position in the repository family

Engine is the lowest rendering boundary in the interface stack. It knows how to represent and draw spatial primitives, but it does not know what a product control, node, workflow, or domain entity means.

```text
MetaFor product integration
  ├─ Node authoring and layout ────────────────┐
  ├─ HTML DOM ─> document renderer ────────────┼─> @engine/core ─> WebGPU
  └─ direct spatial projections ───────────────┘
```

The intended dependency direction is toward Engine. Engine never imports UI, Nodes, or MetaFor. This keeps the library reusable and prevents product policy from entering GPU infrastructure.

Cross-repository owners:

| Owner | Repository | Pages |
| --- | --- | --- |
| Engine | [zavx0z/engine](https://github.com/zavx0z/engine) | External declaration |
| UI | [zavx0z/ui](https://github.com/zavx0z/ui) | [reserved](https://zavx0z.github.io/ui/) |
| Node | [zavx0z/node](https://github.com/zavx0z/node) | [reserved](https://zavx0z.github.io/node/) |
| Product | [zavx0z/metafor](https://github.com/zavx0z/metafor) | Product-owned surfaces |

## Workspace boundaries

### `@engine/core`

The core is the only runtime package. Its root export owns:

- animation clips, mixers, actions, tracks and skeletons;
- retained scene objects and world-transform propagation;
- geometry, meshes, instancing and ray casting;
- material parameters and analytical interface materials;
- vectors, matrices, quaternions, rays, planes and bounds;
- glTF, texture and TrueType loading;
- WebGPU pipeline creation, buffer ownership, culling and frame readback;
- `Space` and `ViewPoint` scene boundaries.

It has no production package dependencies. Browser and WebGPU APIs are the runtime platform. `bun-webgpu` exists only in the repository test toolchain.

### External Storybook declaration

Engine contains one runtime package and no Storybook npm package. The project
declaration at `.storybook/manifest.json` references the `@engine/core` package
declaration under `packages/core/.storybook/`. Both are versioned JSON data;
they import nothing and own no process, port, build or frontend.

Core-owned story modules remain in `packages/core/storybook/**`, outside
production exports and the production TypeScript project. `catalog.json` binds
each exact module/export and preserves the five accepted route suffixes. The
external compiler generates literal lazy imports and independently versions
the `@engine/core` package session.

The plain `storybook-runtime/3` adapter uses the public `@engine/core` owner and
a Storybook-owned compiled TSX preview anchor. All five subjects declare
`story-presentation/1` with `projection: "world"`. A selected story contributes
one `Object3D` root, background and camera; the stage attaches/detaches that root
on exact `context.space === DocumentSpaceRuntime.space` and restores the prior
background. The shared host owns the one semantic Document, native Canvas,
Renderer, Space, ViewPoint, input and frame lifecycle; neither story nor adapter
creates another presentation owner. The adapter publishes node/root/source/props
through one atomic `context.present`; it does not own
navigation, search, routing, diagnostics, package lifecycle or another
presentation host.

Overview routes are shared-shell states and never execute a hidden first leaf.
The Storybook remains a development projection, not an alternate renderer or
an Engine feature owner.

## Core invariants

### Coordinates

Engine uses a right-handed, Z-up coordinate system. One world unit is one millimetre. Consumers pass positions, radii, camera distances, and layout dimensions in that coordinate system rather than applying product-local conversions inside a scene.

### Retained transforms

Every `Object3D` owns only its local position, rotation, and scale. Engine computes `matrixWorld` through the parent chain and submits the resulting world matrix. A parent transform updates descendants without rebuilding unchanged geometry.

### Presentation clipping

Framebuffer clipping is material presentation derived from the actual world transform and owning viewport. It does not rewrite geometry. Plain meshes, text, images, and rounded surfaces follow the same optional clip boundary.

Resolved `Object3D.presentationClips` are analytical rounded rectangles in
their owning local coordinate spaces. Nested shapes intersect in the fragment
stage, so translation, rotation, scale, and perspective preserve one retained
presentation boundary without rematerializing descendants.

### GPU ownership

Renderer owns GPU buffers, textures, bind groups, pipeline selection, upload ranges, and resource invalidation. Consumers describe scene data; they do not allocate hidden renderer resources.

Mutable `BufferAttribute` data carries validated element-dirty intervals that
Renderer converts to bounded aligned queue writes with per-cache revision
catch-up. Fragmented interval count and instance capacity are explicitly
bounded. `InstanceLayer` is the target-neutral retained CPU ABI for dynamic
batches: stable layer-owned generation-guarded slots, geometrically grown
opaque records, and separate dense order. It does not define consumer records
or a UI pipeline.

The concrete rounded-rectangle presentation slice adds one shared unit quad
and storage/order pipeline on top of that ABI. Consecutive draw-range views
share the same stable slots; they are Engine objects, not UI components, and
carry no DOM, hit-test or Node semantics.

The analytical stroked-path slice uses the same retained law with independent
32-byte style and sampled-segment records. Every segment references a stable
physical style slot and generation, while dense segment order and consecutive
draw-range views control presentation. One shared run transform, exact
presentation clip chains and one indexed instanced capsule draw replace
per-segment objects without moving document, graph or authoring semantics into
Engine. This capsule batch is an opaque fast path; continuous translucent paths
remain on a connected scalar geometry owner.

TrueType text keeps one weak font-owned glyph cache and one bounded string
layout cache. Glyph stencil/cover geometry is reusable only for the exact font
identity and glyph id. Cover bounds include the glyph advance cell so retained
text uses font side bearings instead of consumer padding or per-frame geometry
expansion.

### Bounded view composition

One initialized `Renderer` can present a base `Space`, ordered bounded
descendant `Space` views and foreground overlays through one canvas and one
current texture. `Renderer.renderComposition()` accepts physical backing-pixel
viewports. Every bounded root is an exact non-nested descendant of the base
Space and is excluded from base traversal, so one retained object subtree is
not submitted through two cameras accidentally.

Each bounded view owns its exact `ViewPoint`, frustum, view/scene uniforms,
background and cleared depth/stencil state. Viewport and scissor constrain its
color to the declared rectangle; pixels outside remain owned by the preceding
composition layer. The base is presented first, bounded views follow caller
order, and optional overlays remain foreground. Geometry and pipelines stay in
the same Renderer caches, and last-frame capture observes the final complete
composition. Existing `render()` and `renderFrame()` are compatibility entry
points over the same composition path.

`ViewPoint` also supports `controls: "host"`. In that mode it owns camera math
but no browser listener or element mutation. The browser composition owner
supplies and updates one client-coordinate viewport, routes `orbit`, `pan` and
anchored `zoom`, and coalesces presentation requests itself.

### Demand-driven rendering

An unchanged immersive interface should not require a permanent render loop. The Storybook follows the same law: input, resize, reset, or story selection requests one frame. Engine can still serve applications that explicitly choose animation.

### Analytical materials

Rounded shadows, color pickers, holographic surfaces, and thin-film surfaces are bounded analytical passes. Their contracts avoid unowned framebuffer reads, post-processing graphs, and hidden animation state.

### Skinning

Only `SkinnedMesh` carries bone data. Bone and inverse-pose matrices are paired, bounded to 128 bones, and applied in mesh-local space before the mesh world transform.

The detailed source-level law is preserved in [`packages/core/contract.md`](./packages/core/contract.md).

## Source organization

All directories and filenames are lowercase. Multiword filenames use kebab-case. Names describe the owned concept rather than a consumer or historical implementation detail.

```text
packages/core/
  .storybook/   external package declaration, catalog and structural runtime
  storybook/    development-only owner descriptors and lazy scene modules
  src/
    animation/   temporal transforms
    core/        retained objects and geometry buffers
    geometries/  procedural geometry
    helpers/     visual spatial guides
    layout/      low-level retained layout data
    lights/      light primitives
    loaders/     external resource decoding
    materials/   renderer-facing presentation inputs
    math/        allocation-conscious spatial math
    objects/     renderable retained objects
    renderer/    WebGPU pipelines and resource ownership
    scenes/      root spaces
    text/        TrueType decoding and mesh text
    types/       asset-module declarations
  static/fonts/  accepted runtime font assets, licenses and provenance
  test/          package-local test support
```

Tests are co-located with their owner as `*.test.ts`. Live catalog stories are `*.stories.ts`. Atom Material Icons names are used for project-tree discoverability; local SVGs avoid a runtime dependency on an icon plugin.

## External Storybook delivery

One external server attaches the project declaration and serves every package
tab from one origin. `@engine/core` receives its own compiler context, immutable
revisions, last-good artifact, diagnostics and package-scoped updates. Engine
does not install the tool or write static output through a package-local script.

Story navigation uses the preserved pathname suffixes. Overview routes end in
`/`, exact detail routes do not, and unknown suffixes fail closed instead of
selecting a fallback story. The default font remains an Engine asset resolved
through its public subpath; declaration files do not copy it. Deployment or
Pages delivery remains a separate owner decision and is not implied by a local
attach, package build or browser proof.

## Performance change gate

Performance-sensitive changes need evidence in the owner layer. A useful benchmark records at least:

- CPU time for scene traversal and materialization;
- allocations and GPU upload bytes;
- draw and dispatch counts;
- frame p50, p95, and p99;
- input-to-present latency;
- retained GPU and process memory.

A faster temporary demo is not sufficient if it changes clipping, transforms, color, picking, or resource lifetime. Correctness tests and a representative consumer path remain part of acceptance.

## Package evolution

Packages are internal and source-exported today. A future registry release is a separate decision that must define compiled output, semantic versioning, provenance for bundled assets, and consumer migration. Repository separation alone does not make an API stable or published.
