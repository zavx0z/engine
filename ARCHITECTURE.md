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

Its responsibilities are:

- construct small, observable live scenes;
- expose story provenance and contract tags;
- verify project-base-safe static output;
- provide a public documentation surface;
- remain deployable as plain files under `/engine/`.

The Storybook is not an alternate renderer and does not own Engine features.

## Core invariants

### Coordinates

Engine uses a right-handed, Z-up coordinate system. One world unit is one millimetre. Consumers pass positions, radii, camera distances, and layout dimensions in that coordinate system rather than applying product-local conversions inside a scene.

### Retained transforms

Every `Object3D` owns only its local position, rotation, and scale. Engine computes `matrixWorld` through the parent chain and submits the resulting world matrix. A parent transform updates descendants without rebuilding unchanged geometry.

### Presentation clipping

Framebuffer clipping is material presentation derived from the actual world transform and owning viewport. It does not rewrite geometry. Plain meshes, text, images, and rounded surfaces follow the same optional clip boundary.

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

`packages/storybook/scripts/build.ts` uses Bun's HTML bundler with the WGSL text loader. The artifact is emitted with the public base `/engine/`, then receives:

- `index.html` for the project root;
- `404.html` as a static Pages fallback;
- `.nojekyll` to preserve emitted asset names;
- bundled JavaScript, CSS, font and source maps.

Story navigation uses URL hashes, so every story remains addressable without server-side routing. The Pages workflow runs type checking, all tests, and the production build before uploading the artifact.

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
