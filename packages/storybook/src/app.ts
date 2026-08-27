/**
Repository-owned Engine Storybook inside the shared five-region Workbench.

Workbench chrome renders through one `UiRuntime`. The preview remains a real
Engine-owned canvas with its own production Renderer and perspective camera.
Both canvases use one dependency identity and one pathname router.

@packageDocumentation
*/

import {UiRuntime} from "@layout/core/runtime"
import {
  StorybookRouteTreeRouter,
  type StorybookRouteTreeNode,
} from "@zavx0z/storybook/route-tree"
import type {
  StorybookStoryArgs,
  StorybookStoryIndexItem,
  StorybookStorySource,
} from "@zavx0z/storybook/stories"
import {
  StorybookBackdropSurface,
  StorybookDockSurface,
  StorybookNavigationSurface,
  StorybookStoryPanelSurface,
  planStorybookShell,
  type StorybookNavigationItem,
  type StorybookResponsivePolicy,
  type StorybookStoryPanelCategory,
  type StorybookStoryPanelOptions,
} from "@zavx0z/storybook/workbench"
import {
  storybookPublicPath,
  waitForStorybookFrameBoundary,
} from "@zavx0z/storybook/environment"
import {
  ENGINE_STORYBOOK_CATALOG,
  engineStorybookPresentationRoute,
} from "./catalog.ts"
import {
  ENGINE_PREVIEW_CONTENT_INSET,
  ENGINE_PREVIEW_CONTENT_TOP,
  EnginePreviewSurface,
} from "./engine-preview-surface.ts"
import {WebGpuStage} from "./webgpu-stage.ts"

const ENGINE_STORYBOOK_MOUNT = storybookPublicPath("engine", "/")
const ENGINE_STORYBOOK_RESPONSIVE: StorybookResponsivePolicy = Object.freeze({
  compactBelow: null,
  compactPanels: Object.freeze([]),
})
const EMPTY_ARGS = Object.freeze({}) satisfies StorybookStoryArgs

async function startEngineStorybook(): Promise<void> {
  const engineCanvas = requireEngineCanvas()
  engineCanvas.setAttribute("aria-label", "Живая сцена @engine/core")
  const workbenchCanvas = document.createElement("canvas")
  workbenchCanvas.id = "engine-workbench-canvas"
  workbenchCanvas.setAttribute("aria-label", "Рабочее окно Engine Storybook")
  engineCanvas.before(workbenchCanvas)
  document.documentElement.dataset.engineStorybook = "starting"

  try {
    const runtime = await UiRuntime.create(workbenchCanvas, {
      virtualDisplay: {initial: "near", surfaceDisplay: true, grid: false},
    })
    runtime.handleResize()

    const router = new StorybookRouteTreeRouter(ENGINE_STORYBOOK_CATALOG.routeTree, {
      basePath: ENGINE_STORYBOOK_MOUNT,
    })
    const initial = await loadStableEngineStory(router)
    const initialNode = initial.node
    let storyRoute = initial.route
    let storyIndex = initial.index
    let story = initial.story
    let panelCategory: StorybookStoryPanelCategory = "source"
    let catalogQuery = ""
    let collapsedGroups = new Set<string>()
    let selectionRevision = 0
    let resetCount = 0
    let engineState = "Загрузка"

    const frames = (width: number, height: number) => planStorybookShell(width, height, {
      responsive: ENGINE_STORYBOOK_RESPONSIVE,
    })
    const positionEngineCanvas = (): void => {
      const shell = frames(workbenchCanvas.clientWidth, workbenchCanvas.clientHeight)
      const preview = shell.preview
      const x = preview.x + ENGINE_PREVIEW_CONTENT_INSET
      const y = preview.y + ENGINE_PREVIEW_CONTENT_TOP
      const width = Math.max(1, preview.w - ENGINE_PREVIEW_CONTENT_INSET * 2)
      const height = Math.max(1, preview.h - ENGINE_PREVIEW_CONTENT_TOP - ENGINE_PREVIEW_CONTENT_INSET)
      engineCanvas.style.left = `${x}px`
      engineCanvas.style.top = `${y}px`
      engineCanvas.style.width = `${width}px`
      engineCanvas.style.height = `${height}px`
      engineCanvas.style.visibility = "visible"
      engineCanvas.hidden = preview.visible === false || preview.w <= 0 || preview.h <= 0
    }
    positionEngineCanvas()

    const stage = await WebGpuStage.create(engineCanvas)
    const navigate = (route: string): void => {
      if (!router.go(route)) publishError(new Error(`Неизвестный маршрут Engine Storybook: ${route}`))
    }
    const backdrop = new StorybookBackdropSurface()
    const catalog = new StorybookNavigationSurface<string>(catalogOptions())
    const sections = new StorybookNavigationSurface<string>(sectionOptions())
    const dock = new StorybookDockSurface<string>(dockOptions())
    const preview = new EnginePreviewSurface(storyIndex, story)
    let storyPanel: StorybookStoryPanelSurface

    const panelOptions = (): StorybookStoryPanelOptions => ({
      source: engineStorySource(story),
      args: EMPTY_ARGS,
      controls: [],
      events: [
        {id: "state", label: "Состояние", value: engineState},
        {id: "frames", label: "Представленные кадры", value: String(stage.frames)},
        {id: "reset", label: "Сброс вида", value: `${resetCount} · двойной клик по сцене`},
      ],
      category: panelCategory,
      onCategoryChange(category) {
        panelCategory = category
        storyPanel.setOptions(panelOptions())
        publish()
      },
      onControlChange() {},
      async onCopy(kind, source) {
        try {
          await navigator.clipboard.writeText(source)
          document.documentElement.dataset.engineStorybookCopy = `${kind}:copied`
        } catch {
          document.documentElement.dataset.engineStorybookCopy = `${kind}:error`
        }
      },
    })
    storyPanel = new StorybookStoryPanelSurface(panelOptions())

    runtime.addSurface(backdrop, ({w, h}) => ({x: 0, y: 0, w, h}))
    runtime.addSurface(catalog, ({w, h}) => frames(w, h).catalog)
    runtime.addSurface(sections, ({w, h}) => frames(w, h).section)
    runtime.addSurface(preview, ({w, h}) => frames(w, h).preview)
    runtime.addSurface(dock, ({w, h}) => frames(w, h).dock)
    runtime.addSurface(storyPanel, ({w, h}) => frames(w, h).info)

    function catalogOptions() {
      return {
        title: "Каталог Engine",
        items: catalogItems(collapsedGroups),
        route: storyIndex.componentId,
        onNavigate: navigate,
        query: catalogQuery,
        searchPlaceholder: "API, материал, геометрия…",
        onQueryChange(query: string) {
          catalogQuery = query
          catalog.setOptions(catalogOptions())
          publish()
        },
        onGroupToggle(groupId: string, collapsed: boolean) {
          collapsedGroups = new Set(collapsedGroups)
          if (collapsed) collapsedGroups.add(groupId)
          else collapsedGroups.delete(groupId)
          catalog.setOptions(catalogOptions())
          publish()
        },
      }
    }

    function sectionOptions() {
      return {
        title: storyIndex.componentLabel,
        items: sectionItems(storyIndex),
        route: `${storyIndex.componentId}/${storyIndex.sectionId}`,
        onNavigate: navigate,
      }
    }

    function dockOptions() {
      return {
        title: "Варианты",
        items: variantItems(storyIndex),
        route: router.current.kind === "leaf" ? router.current.path : "",
        onNavigate: navigate,
      }
    }

    function publish(): void {
      for (const surface of [backdrop, catalog, sections, dock, preview, storyPanel]) surface.flushPendingRender()
      document.documentElement.dataset.engineStorybookRoute = router.current.path
      document.documentElement.dataset.engineStorybookRouteKind = router.current.kind
      document.documentElement.dataset.engineStorybookStory = storyRoute
      document.documentElement.dataset.engineStorybookStoryId = story.id
      document.documentElement.dataset.engineStorybookFrames = String(stage.frames)
      document.documentElement.dataset.engineStorybookCanvas = engineCanvas.hidden ? "hidden" : "visible"
      const source = engineStorySource(story)
      document.documentElement.dataset.engineStorybookHtml = source.html
      document.documentElement.dataset.engineStorybookCss = source.css
      document.documentElement.dataset.engineStorybookTypescript = source.typescript
    }

    async function applyRoute(node: StorybookRouteTreeNode<string>): Promise<void> {
      const revision = ++selectionRevision
      stage.invalidateSelection()
      document.documentElement.dataset.engineStorybook = "starting"
      engineState = "Загрузка"
      storyPanel.setOptions(panelOptions())
      publish()
      try {
        const nextRoute = engineStorybookPresentationRoute(node.path)
        const nextIndex = requireStory(nextRoute)
        const nextStory = await ENGINE_STORYBOOK_CATALOG.load(nextRoute)
        if (revision !== selectionRevision || router.current !== node) return
        storyRoute = nextRoute
        storyIndex = nextIndex
        story = nextStory
        catalog.setOptions(catalogOptions())
        sections.setOptions(sectionOptions())
        dock.setOptions(dockOptions())
        preview.setStory(storyIndex, story)
        await stage.show(story)
        if (revision !== selectionRevision || router.current !== node) return
        engineState = "Готово"
        storyPanel.setOptions(panelOptions())
        runtime.relayout()
        positionEngineCanvas()
        publish()
        await waitForStorybookFrameBoundary()
        if (revision !== selectionRevision || router.current !== node) return
        document.documentElement.dataset.engineStorybook = "ready"
      } catch (error) {
        if (revision === selectionRevision) throw error
      }
    }

    const resetView = async (): Promise<void> => {
      if (engineState !== "Готово") return
      const revision = selectionRevision
      engineState = "Загрузка"
      storyPanel.setOptions(panelOptions())
      publish()
      const committed = await stage.reset()
      if (!committed || revision !== selectionRevision) return
      resetCount += 1
      engineState = "Готово"
      storyPanel.setOptions(panelOptions())
      publish()
    }
    engineCanvas.addEventListener("dblclick", () => {
      void resetView().catch(publishError)
    })
    router.subscribe((node) => {
      void applyRoute(node).catch(publishError)
    })
    new ResizeObserver(() => {
      runtime.handleResize()
      positionEngineCanvas()
      publish()
    }).observe(workbenchCanvas)

    runtime.handleResize()
    positionEngineCanvas()
    if (router.current !== initialNode) {
      await applyRoute(router.current)
      return
    }
    const committed = await stage.show(story)
    if (!committed || router.current !== initialNode || selectionRevision !== 0) return
    engineState = "Готово"
    storyPanel.setOptions(panelOptions())
    publish()
    await waitForStorybookFrameBoundary()
    if (router.current !== initialNode || selectionRevision !== 0) return
    document.documentElement.dataset.engineStorybook = "ready"
  } catch (error) {
    publishError(error)
    throw error
  }
}

function engineStorySource(story: Readonly<{id: string; source: string}>): StorybookStorySource {
  return Object.freeze({
    html: `<canvas id="engine-story-canvas" class="engine-story" data-story="${story.id}" aria-label="Живая сцена @engine/core"></canvas>`,
    css: `.engine-story {
  position: fixed;
  width: 100%;
  height: 100%;
  display: block;
  border: 0;
  border-radius: 3px;
  background: #05080e;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 8%);
  outline: none;
  touch-action: none;
}`,
    typescript: story.source,
  })
}

async function loadStableEngineStory(router: StorybookRouteTreeRouter<string>) {
  while (true) {
    const node = router.current
    const route = engineStorybookPresentationRoute(node.path)
    const index = requireStory(route)
    const story = await ENGINE_STORYBOOK_CATALOG.load(route)
    if (router.current === node) return Object.freeze({node, route, index, story})
  }
}

function requireEngineCanvas(): HTMLCanvasElement {
  const canvas = document.getElementById("engine-story-canvas")
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error("engine-story-canvas not found")
  return canvas
}

function requireStory(route: string): StorybookStoryIndexItem {
  const story = ENGINE_STORYBOOK_CATALOG.find(route)
  if (story === undefined) throw new Error(`Engine Storybook story not found: ${route}`)
  return story
}

function catalogItems(collapsed: ReadonlySet<string>): readonly StorybookNavigationItem<string>[] {
  const firstByComponent = new Map<string, StorybookStoryIndexItem>()
  for (const item of ENGINE_STORYBOOK_CATALOG.index) {
    if (!firstByComponent.has(item.componentId)) firstByComponent.set(item.componentId, item)
  }
  return [...firstByComponent.values()].map((item) => ({
    id: item.componentId,
    label: item.componentLabel,
    route: item.componentId,
    group: {
      id: item.groupId,
      label: item.groupLabel,
      collapsed: collapsed.has(item.groupId),
    },
    searchText: `${item.apiName} ${item.tags.join(" ")}`,
  }))
}

function sectionItems(selected: StorybookStoryIndexItem): readonly StorybookNavigationItem<string>[] {
  const firstBySection = new Map<string, StorybookStoryIndexItem>()
  for (const item of ENGINE_STORYBOOK_CATALOG.index) {
    if (item.componentId === selected.componentId && !firstBySection.has(item.sectionId)) {
      firstBySection.set(item.sectionId, item)
    }
  }
  return [...firstBySection.values()].map((item) => ({
    id: item.sectionId,
    label: item.sectionLabel,
    route: `${item.componentId}/${item.sectionId}`,
  }))
}

function variantItems(selected: StorybookStoryIndexItem): readonly StorybookNavigationItem<string>[] {
  return ENGINE_STORYBOOK_CATALOG.variants(selected.route).map((item) => ({
    id: item.variantId,
    label: item.variantLabel,
    route: item.route,
  }))
}

function publishError(error: unknown): void {
  document.documentElement.dataset.engineStorybook = "error"
  document.documentElement.dataset.engineStorybookError = error instanceof Error
    ? error.stack ?? error.message
    : String(error)
}

if (typeof document !== "undefined") await startEngineStorybook()
