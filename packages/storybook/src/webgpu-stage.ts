import {Renderer, ViewPoint} from "@engine/core"
import type {EngineStory, StoryScene} from "../../core/storybook/story"
import {StorySceneState} from "./story-scene-state"

export class WebGpuStage {
  readonly #canvas: HTMLCanvasElement
  readonly #renderer = new Renderer()
  readonly #resizeObserver: ResizeObserver
  readonly #storyState = new StorySceneState()
  readonly #requestFromInput = (): void => this.requestRender()
  #scene: StoryScene | null = null
  #viewPoint: ViewPoint | null = null
  #rafId = 0
  #presentedFrames = 0
  #disposed = false

  private constructor(canvas: HTMLCanvasElement) {
    this.#canvas = canvas
    this.#resizeObserver = new ResizeObserver(() => this.#resize())
    this.#resizeObserver.observe(canvas)

    canvas.addEventListener("wheel", this.#requestFromInput, {passive: true})
    canvas.addEventListener("mousedown", this.#requestFromInput)
    canvas.addEventListener("touchstart", this.#requestFromInput, {passive: true})
    document.addEventListener("mousemove", this.#requestFromInput)
    document.addEventListener("mouseup", this.#requestFromInput)
    document.addEventListener("touchmove", this.#requestFromInput, {passive: true})
    document.addEventListener("touchend", this.#requestFromInput)
  }

  static async create(canvas: HTMLCanvasElement): Promise<WebGpuStage> {
    const stage = new WebGpuStage(canvas)
    await stage.#renderer.init(canvas)
    stage.#renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    stage.#resize(false)
    return stage
  }

  get frames(): number {
    return this.#presentedFrames
  }

  invalidateSelection(): void {
    this.#storyState.invalidate()
  }

  async show(story: EngineStory): Promise<boolean> {
    const scene = await this.#storyState.show(story)
    if (scene === null) return false
    this.#showScene(scene)
    return true
  }

  async reset(): Promise<boolean> {
    const scene = await this.#storyState.reset()
    if (scene === null) return false
    this.#showScene(scene)
    return true
  }

  requestRender(): void {
    if (this.#disposed || this.#rafId !== 0) return
    this.#rafId = requestAnimationFrame(() => {
      this.#rafId = 0
      this.#renderNow()
    })
  }

  dispose(): void {
    if (this.#disposed) return
    this.#disposed = true
    this.#storyState.invalidate()
    this.#resizeObserver.disconnect()
    this.#canvas.removeEventListener("wheel", this.#requestFromInput)
    this.#canvas.removeEventListener("mousedown", this.#requestFromInput)
    this.#canvas.removeEventListener("touchstart", this.#requestFromInput)
    document.removeEventListener("mousemove", this.#requestFromInput)
    document.removeEventListener("mouseup", this.#requestFromInput)
    document.removeEventListener("touchmove", this.#requestFromInput)
    document.removeEventListener("touchend", this.#requestFromInput)
    if (this.#rafId !== 0) cancelAnimationFrame(this.#rafId)
    this.#rafId = 0
    this.#viewPoint?.dispose()
    this.#viewPoint = null
    this.#scene = null
  }

  #showScene(scene: StoryScene): void {
    this.#scene = scene
    this.#replaceViewPoint()
    if (this.#rafId !== 0) {
      cancelAnimationFrame(this.#rafId)
      this.#rafId = 0
    }
    this.#renderNow()
  }

  #replaceViewPoint(): void {
    this.#viewPoint?.dispose()
    const scene = this.#scene
    if (scene === null) {
      this.#viewPoint = null
      return
    }
    this.#viewPoint = new ViewPoint({
      element: this.#canvas,
      position: scene.camera.position,
      target: scene.camera.target,
      near: scene.camera.near ?? 1,
      far: scene.camera.far ?? 2000,
      fov: Math.PI / 4,
    })
    this.#resize(false)
  }

  #resize(request = true): void {
    if (this.#disposed) return
    const width = Math.max(1, this.#canvas.clientWidth)
    const height = Math.max(1, this.#canvas.clientHeight)
    this.#renderer.setSize(width, height)
    this.#viewPoint?.setAspectRatio(width / height)
    this.#scene?.resize?.({width: this.#canvas.width, height: this.#canvas.height})
    if (request) this.requestRender()
  }

  #renderNow(): void {
    if (this.#disposed || this.#scene === null || this.#viewPoint === null) return
    renderStoryScene(this.#renderer, this.#scene, this.#viewPoint)
    this.#presentedFrames += 1
  }
}

export function renderStoryScene(
  renderer: Pick<Renderer, "render">,
  scene: StoryScene,
  viewPoint: ViewPoint,
): void {
  scene.space.updateWorldMatrix()
  renderer.render(scene.space, viewPoint)
}
