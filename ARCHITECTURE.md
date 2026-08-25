# Engine architecture

**Built for [MetaFor](https://github.com/zavx0z/metafor), while preserving a reusable WebGPU core for other immersive applications.**

## Position in the repository family

Engine is the lowest rendering boundary in the interface stack. It knows how to represent and draw spatial primitives, but it does not know what a product control, node, workflow, or domain entity means.

```text
MetaFor product integration
  ├─ Node authoring and layout ────────────────┐
  ├─ UI controls ─> Layout UI runtime ─────────┼─> @engine/core ─> WebGPU
  └─ direct spatial projections ───────────────┘
```

The intended dependency direction is toward Engine. Engine never imports UI, Nodes, or MetaFor. This keeps the library reusable and prevents product policy from entering GPU infrastructure.

Cross-repository owners:

| Owner | Repository | Pages |
| --- | --- | --- |
| Engine | [zavx0z/engine](https://github.com/zavx0z/engine) | [Engine Storybook](https://zavx0z.github.io/engine/) |
| Layout | [zavx0z/layout](https://github.com/zavx0z/layout) | [Layout Storybook](https://zavx0z.github.io/layout/) |
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

### `@engine/storybook`

The Storybook is a static consumer of the public `@engine/core` entrypoint. It must not bypass the package boundary with relative imports into Core.

Core-owned development descriptors live in `packages/core/storybook/**`, next
to their semantic owner but outside `@engine/core` exports and production
TypeScript project. The private repository Storybook composes those descriptors
through `@zavx0z/storybook/stories`; it does not copy scene semantics into the
application package.

Its responsibilities are:

- construct small, observable live scenes;
- expose story provenance and contract tags;
- verify project-base-safe static output;
- provide a public documentation surface;
- remain deployable as plain files under `/engine/`.

The app uses the shared five-region Workbench from exact
`@zavx0z/storybook/*` subpaths. Layout and UI are direct dependencies only of
this private development app. The preview is an Engine-owned canvas layered
inside the shared preview frame, so its perspective camera, orbit/pan input and
production renderer remain intact without adding UI dependencies to Core.

The Storybook is not an alternate renderer and does not own Engine features.

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
  static/fonts/  accepted runtime font asset
  test/          package-local test support
```

Tests are co-located with their owner as `*.test.ts`. Live catalog stories are `*.stories.ts`. Atom Material Icons names are used for project-tree discoverability; local SVGs avoid a runtime dependency on an icon plugin.

## Static Storybook pipeline

`packages/storybook/scripts/build.ts` delegates the typed Engine app manifest
to `@zavx0z/storybook/build`. The artifact is emitted with public base
`/engine/` and contains:

- `index.html` for the project root;
- `404.html` as a static Pages fallback;
- `.nojekyll` to preserve emitted asset names;
- independent browser entry and lazy story chunks;
- the exact Engine font;
- `storybook-manifest.json` schema 1 with source/dependency revisions,
  readiness and canvas evidence, emitted sizes and SHA-256 hashes.

Story navigation uses pathname routes. Overview routes end in `/`, exact detail
routes do not, and unknown suffixes fail closed instead of selecting a fallback
story. The Pages fallback recovers only a route registered in the catalog.
Pages remains manual and may run only after shared dependencies are delivered
at immutable revisions and its cold bootstrap pins are updated; a local link
graph or successful local build is not deployment evidence.

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
