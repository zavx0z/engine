# Требования `@engine/storybook`

## ENGINE-STORYBOOK-DOM-001 — semantic shell, independent Engine preview

The private package uses one `@zavx0z/dom` Document, the shared exact
`@zavx0z/storybook/workbench`, and `@zavx0z/renderer-browser` for catalog,
sections, overview presentations, variants, source provenance and status. It
imports no Layout, Elements, UI Component or retained Workbench owner.

The right Workbench region receives one Engine-owned same-Document Props
Inspector through `inspector.node`. It shows only route and exact story metadata;
HTML, CSS and TypeScript source documents remain machine-readable provenance and
are not rendered in that panel. The Inspector imports no UI package and keeps one
stable semantic root while keyed metadata rows are updated in place.

Exact leaf routes keep one independent browser canvas and the production
`@engine/core` Renderer/ViewPoint scene. Its CSS rectangle is derived from the
semantic preview-host box in the current document frame. The Engine scene does
not become a DOM display item and the Workbench does not copy Engine semantics.

Every overview owns a semantic presentation of its immediate children and
keeps the Engine canvas hidden. It never loads or selects a first descendant
leaf. Exact lazy story loading occurs only for a leaf.

The obsolete cold Pages workflow that pinned Layout/UI/Highlighter is removed.
A new deployment workflow may be introduced only after Renderer and shared
Storybook changes have committed immutable revisions. Local check/build/browser
evidence does not authorize inventing pins or dispatching deployment.
