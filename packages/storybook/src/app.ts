/** DOM Workbench around one independent Engine-owned WebGPU preview canvas. */

import {loadDocumentDefaultFont} from "@engine/core/default-font"
import {
  CustomEvent as DomCustomEvent,
  createDocument,
  type Document,
  type HTMLElement,
  type Text,
} from "@zavx0z/dom"
import {createDocumentCanvasRuntime} from "@zavx0z/renderer-browser"
import type {StorybookDomCatalogIndexItem} from "@zavx0z/storybook/catalog"
import type {StorybookDomStorySource} from "@zavx0z/storybook/stories"
import {
  STORYBOOK_DOM_WORKBENCH_EVENTS,
  createStorybookDomWorkbench,
  storybookDomWorkbenchCss,
  type StorybookDomNavigationItem,
  type StorybookDomScenarioItem,
} from "@zavx0z/storybook/workbench"
import {storybookPublicPath, waitForStorybookFrameBoundary} from "@zavx0z/storybook/environment"
import {StorybookRouteTreeRouter, type StorybookRouteTreeNode} from "@zavx0z/storybook/route-tree"
import type {EngineStory} from "../../core/storybook/story.ts"
import {ENGINE_STORYBOOK_CATALOG} from "./catalog.ts"
import {WebGpuStage} from "./webgpu-stage.ts"

const MOUNT = storybookPublicPath("engine", "/")
const PREVIEW_INSET = 2

const engineWorkbenchCss = String.raw`
.engine-storybook-presentation { box-sizing: border-box; display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 220px; gap: 10px; padding: 18px; border: 1px solid #30343c; border-radius: 4px; background: #05080e; color: #e0e0e0; }
.engine-storybook-presentation__title { display: block; color: #7edcec; font-size: 16px; }
.engine-storybook-presentation__description, .engine-storybook-presentation__item { display: block; color: #b0b0b0; font-size: 12px; }
.engine-storybook-presentation__items { display: flex; flex-direction: column; gap: 6px; }
`

type PreviewPresentation = Readonly<{
  element: HTMLElement
  title: Text
  description: Text
  items: HTMLElement
}>

async function start(): Promise<void> {
  const engineCanvas = requireEngineCanvas()
  const shellCanvas = document.createElement("canvas")
  shellCanvas.id = "engine-workbench-canvas"
  shellCanvas.setAttribute("aria-label", "Рабочее окно Engine Storybook")
  engineCanvas.setAttribute("aria-label", "Живая сцена @engine/core")
  engineCanvas.before(shellCanvas)
  document.documentElement.dataset.engineStorybook = "starting"

  try {
    const semanticDocument = createDocument()
    const presentation = createPresentation(semanticDocument)
    const workbench = createStorybookDomWorkbench({
      document: semanticDocument,
      parent: semanticDocument,
      initial: {
        title: "Engine Storybook",
        "catalog.label": "Каталог Engine",
        "catalog.items": catalogItems(),
        "catalog.active": null,
        "secondary.label": "Разделы",
        "secondary.items": Object.freeze([]),
        "secondary.active": null,
        "preview.label": "Engine · Обзор",
        "preview.node": presentation.element,
        "scenarios.label": "Варианты",
        "scenarios.items": Object.freeze([]),
        "scenarios.active": null,
        "inspector.label": "Исходный код",
        "inspector.source": overviewSource("Engine · Обзор", "Корневой каталог Engine"),
        status: {lead: "Создано для ", owner: "MetaFor", detail: " · Engine DOM Workbench"},
      },
    })
    const font = await loadDocumentDefaultFont()
    const runtime = await createDocumentCanvasRuntime({
      canvas: shellCanvas,
      document: semanticDocument,
      root: workbench.element,
      styleSheets: [storybookDomWorkbenchCss, engineWorkbenchCss],
      font,
      tooltipDelayMs: 500,
    })
    const stage = await WebGpuStage.create(engineCanvas)
    const router = new StorybookRouteTreeRouter(ENGINE_STORYBOOK_CATALOG.routeTree, {basePath: MOUNT})
    let routeRevision = 0
    let story: EngineStory | null = null
    let index: StorybookDomCatalogIndexItem | null = null
    let resets = 0
    let disposed = false

    const positionPreview = (): void => {
      const box = runtime.currentFrame.boxes.find(({node}) => node === workbench.elements.previewHost)
      if (box === undefined || box.width <= 0 || box.height <= 0 || story === null) {
        engineCanvas.hidden = true
        engineCanvas.style.visibility = "hidden"
        return
      }
      const rect = shellCanvas.getBoundingClientRect()
      const scaleX = rect.width / runtime.viewport.width
      const scaleY = rect.height / runtime.viewport.height
      const {scaleX: transformX, scaleY: transformY, translateX, translateY} = box.transform
      const x = transformX * box.x + translateX
      const y = transformY * box.y + translateY
      const width = Math.abs(transformX) * box.width
      const height = Math.abs(transformY) * box.height
      engineCanvas.style.left = `${rect.left + (x + PREVIEW_INSET) * scaleX}px`
      engineCanvas.style.top = `${rect.top + (y + PREVIEW_INSET) * scaleY}px`
      engineCanvas.style.width = `${Math.max(1, (width - PREVIEW_INSET * 2) * scaleX)}px`
      engineCanvas.style.height = `${Math.max(1, (height - PREVIEW_INSET * 2) * scaleY)}px`
      engineCanvas.hidden = false
      engineCanvas.style.visibility = "visible"
    }
    const unsubscribeFrame = runtime.subscribe(positionPreview)

    const navigate = (route: string): void => {
      if (!router.go(route)) throw new Error(`Неизвестный маршрут Engine Storybook: ${route}`)
    }
    const onNavigate = (event: unknown): void => navigate(
      (event as DomCustomEvent<{route: string}>).detail.route,
    )
    const onScenario = (event: unknown): void => navigate(
      (event as DomCustomEvent<{id: string}>).detail.id,
    )
    workbench.element.addEventListener(STORYBOOK_DOM_WORKBENCH_EVENTS.navigate, onNavigate)
    workbench.element.addEventListener(STORYBOOK_DOM_WORKBENCH_EVENTS.scenario, onScenario)

    const publish = (
      node: StorybookRouteTreeNode<string>,
      source: StorybookDomStorySource,
      state: string,
    ): void => {
      document.documentElement.dataset.engineStorybookRoute = node.path
      document.documentElement.dataset.engineStorybookRouteKind = node.kind
      document.documentElement.dataset.engineStorybookStory = index?.route ?? "overview"
      document.documentElement.dataset.engineStorybookStoryId = story?.id ?? "overview"
      document.documentElement.dataset.engineStorybookFrames = String(stage.frames)
      document.documentElement.dataset.engineStorybookCanvas = story === null ? "hidden" : "visible"
      document.documentElement.dataset.engineStorybookHtml = source.html
      document.documentElement.dataset.engineStorybookCss = source.css
      document.documentElement.dataset.engineStorybookTypescript = source.typescript
      workbench.update("status", {
        lead: "Создано для ",
        owner: "MetaFor",
        detail: ` · Engine · ${state} · кадров ${stage.frames} · сбросов ${resets}`,
      })
      runtime.render()
      positionPreview()
    }

    const applyRoute = async (node: StorybookRouteTreeNode<string>): Promise<void> => {
      const revision = ++routeRevision
      document.documentElement.dataset.engineStorybook = "starting"
      stage.invalidateSelection()
      if (node.kind === "overview") {
        story = null
        index = contextFor(node.path)
        const source = applyOverview(workbench, presentation, node)
        publish(node, source, "Обзор")
      } else {
        const nextIndex = requireStory(node.path)
        const nextStory = await ENGINE_STORYBOOK_CATALOG.load(node.path)
        if (revision !== routeRevision || router.current !== node) return
        index = nextIndex
        story = nextStory
        const source = applyLeaf(workbench, presentation, nextIndex, nextStory)
        if (!await stage.show(nextStory) || revision !== routeRevision || router.current !== node) return
        publish(node, source, "Готово")
      }
      await waitForStorybookFrameBoundary()
      if (revision !== routeRevision || router.current !== node) return
      document.documentElement.dataset.engineStorybook = "ready"
    }

    const onReset = (): void => {
      const revision = routeRevision
      void stage.reset().then((committed) => {
        if (!committed || revision !== routeRevision || story === null) return
        resets += 1
        publish(router.current, engineStorySource(story), "Готово")
      }).catch(publishError)
    }
    engineCanvas.addEventListener("dblclick", onReset)
    const unsubscribeRouter = router.subscribe((node) => void applyRoute(node).catch(publishError))

    const dispose = (): void => {
      if (disposed) return
      disposed = true
      routeRevision += 1
      unsubscribeRouter()
      unsubscribeFrame()
      engineCanvas.removeEventListener("dblclick", onReset)
      workbench.element.removeEventListener(STORYBOOK_DOM_WORKBENCH_EVENTS.navigate, onNavigate)
      workbench.element.removeEventListener(STORYBOOK_DOM_WORKBENCH_EVENTS.scenario, onScenario)
      router.dispose()
      stage.dispose()
      runtime.dispose()
      workbench.dispose()
      engineCanvas.hidden = true
    }
    window.addEventListener("pagehide", dispose, {once: true})
    await applyRoute(router.current)
  } catch (error) {
    publishError(error)
    throw error
  }
}

function applyOverview(
  workbench: ReturnType<typeof createStorybookDomWorkbench>,
  presentation: PreviewPresentation,
  node: StorybookRouteTreeNode<string>,
): StorybookDomStorySource {
  const context = contextFor(node.path)
  const children = ENGINE_STORYBOOK_CATALOG.routeTree.children(node.path)
  const title = node.path === ""
    ? "Engine · Обзор"
    : context?.sectionLabel ?? context?.componentLabel ?? node.segment
  const description = node.path === ""
    ? "Публичные пространственные примитивы и production WebGPU-сцены."
    : `Обзор ${title}: ${children.length} непосредственных разделов.`
  updatePresentation(presentation, title, description, children.map((child) => {
    if (child.kind === "leaf") return requireStory(child.path).variantLabel
    const childContext = contextFor(child.path)
    if (child.depth === 1) return childContext?.componentLabel ?? child.segment
    return childContext?.sectionLabel ?? child.segment
  }))
  const source = overviewSource(title, description)
  workbench.document.transaction(() => {
    workbench.update("catalog.active", context?.componentId ?? null)
    workbench.update("secondary.items", context === null ? Object.freeze([]) : sectionItems(context))
    workbench.update("secondary.active", node.depth >= 2 ? context?.sectionId ?? null : null)
    workbench.update("preview.label", title)
    workbench.update("scenarios.items", context === null ? Object.freeze([]) : scenarioItems(context))
    workbench.update("scenarios.active", null)
    workbench.update("inspector.source", source)
  })
  return source
}

function applyLeaf(
  workbench: ReturnType<typeof createStorybookDomWorkbench>,
  presentation: PreviewPresentation,
  index: StorybookDomCatalogIndexItem,
  story: EngineStory,
): StorybookDomStorySource {
  updatePresentation(presentation, story.title, story.description, [])
  const source = engineStorySource(story)
  workbench.document.transaction(() => {
    workbench.update("catalog.active", index.componentId)
    workbench.update("secondary.items", sectionItems(index))
    workbench.update("secondary.active", index.sectionId)
    workbench.update("preview.label", story.title)
    workbench.update("scenarios.items", scenarioItems(index))
    workbench.update("scenarios.active", index.route)
    workbench.update("inspector.source", source)
  })
  return source
}

function createPresentation(document: Document): PreviewPresentation {
  const element = document.createElement("section")
  const heading = document.createElement("h3")
  const title = document.createTextNode("")
  const paragraph = document.createElement("p")
  const description = document.createTextNode("")
  const items = document.createElement("ul")
  element.className = "engine-storybook-presentation"
  heading.className = "engine-storybook-presentation__title"
  paragraph.className = "engine-storybook-presentation__description"
  items.className = "engine-storybook-presentation__items"
  heading.appendChild(title)
  paragraph.appendChild(description)
  element.append(heading, paragraph, items)
  return Object.freeze({element, title, description, items})
}

function updatePresentation(
  presentation: PreviewPresentation,
  title: string,
  description: string,
  labels: readonly string[],
): void {
  presentation.title.data = title
  presentation.description.data = description
  const document = presentation.element.ownerDocument!
  presentation.items.replaceChildren(...labels.map((label) => {
    const item = document.createElement("li")
    item.className = "engine-storybook-presentation__item"
    item.appendChild(document.createTextNode(label))
    return item
  }))
}

function engineStorySource(story: EngineStory): StorybookDomStorySource {
  return Object.freeze({
    html: `<canvas id="engine-story-canvas" class="engine-story" data-story="${story.id}" aria-label="Живая сцена @engine/core"></canvas>`,
    css: ".engine-story { display: block; width: 100%; height: 100%; background: #05080e; touch-action: none; }",
    typescript: story.source,
  })
}

function overviewSource(title: string, description: string): StorybookDomStorySource {
  return Object.freeze({
    html: `<section class="engine-storybook-presentation"><h3>${escapeText(title)}</h3><p>${escapeText(description)}</p></section>`,
    css: engineWorkbenchCss,
    typescript: `const overview = document.createElement("section")\noverview.title = ${JSON.stringify(title)}\noverview.textContent = ${JSON.stringify(description)}\ndocument.appendChild(overview)`,
  })
}

function catalogItems(): readonly StorybookDomNavigationItem[] {
  const items = new Map<string, StorybookDomCatalogIndexItem>()
  for (const item of ENGINE_STORYBOOK_CATALOG.index) if (!items.has(item.componentId)) items.set(item.componentId, item)
  return Object.freeze([...items.values()].map((item) => Object.freeze({
    id: item.componentId,
    label: item.componentLabel,
    route: item.componentId,
    title: `${item.apiName} · ${item.tags.join(", ")}`,
  })))
}

function sectionItems(selected: StorybookDomCatalogIndexItem): readonly StorybookDomNavigationItem[] {
  const items = new Map<string, StorybookDomCatalogIndexItem>()
  for (const item of ENGINE_STORYBOOK_CATALOG.index) {
    if (item.componentId === selected.componentId && !items.has(item.sectionId)) items.set(item.sectionId, item)
  }
  return Object.freeze([...items.values()].map((item) => Object.freeze({
    id: item.sectionId,
    label: item.sectionLabel,
    route: `${item.componentId}/${item.sectionId}`,
  })))
}

function scenarioItems(selected: StorybookDomCatalogIndexItem): readonly StorybookDomScenarioItem[] {
  return Object.freeze(ENGINE_STORYBOOK_CATALOG.variants(selected.route).map((item) => Object.freeze({
    id: item.route,
    label: item.variantLabel,
    title: item.title,
  })))
}

function contextFor(path: string): StorybookDomCatalogIndexItem | null {
  if (path === "") return null
  return ENGINE_STORYBOOK_CATALOG.index.find(({route}) => route.startsWith(`${path}/`)) ?? null
}

function requireStory(route: string): StorybookDomCatalogIndexItem {
  const item = ENGINE_STORYBOOK_CATALOG.find(route)
  if (item === undefined) throw new Error(`Engine Storybook story not found: ${route}`)
  return item
}

function requireEngineCanvas(): HTMLCanvasElement {
  const canvas = document.getElementById("engine-story-canvas")
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error("engine-story-canvas not found")
  return canvas
}

function publishError(error: unknown): void {
  document.documentElement.dataset.engineStorybook = "error"
  document.documentElement.dataset.engineStorybookError = error instanceof Error ? error.stack ?? error.message : String(error)
}

const escapeText = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

if (typeof document !== "undefined") await start()
