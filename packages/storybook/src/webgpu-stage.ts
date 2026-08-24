import {Renderer, ViewPoint} from "@engine/core"
import type {EngineStory, StoryScene} from "./story"

export class WebGpuStage {
  readonly #canvas: HTMLCanvasElement
  readonly #renderer = new Renderer()
  readonly #resizeObserver: ResizeObserver
  #story: EngineStory | null = null
  #scene: StoryScene | null = null
  #viewPoint: ViewPoint | null = null
  #frame = 0

  private constructor(canvas: HTMLCanvasElement) {
    this.#canvas = canvas
    this.#resizeObserver = new ResizeObserver(() => this.#resize())
    this.#resizeObserver.observe(canvas)

    const request = () => this.requestRender()
    canvas.addEventListener("wheel", request, {passive: true})
    canvas.addEventListener("mousedown", request)
    canvas.addEventListener("touchstart", request, {passive: true})
    document.addEventListener("mousemove", request)
    document.addEventListener("mouseup", request)
    document.addEventListener("touchmove", request, {passive: true})
    document.addEventListener("touchend", request)
  }

  static async create(canvas: HTMLCanvasElement): Promise<WebGpuStage> {
    const stage = new WebGpuStage(canvas)
    await stage.#renderer.init(canvas)
    stage.#renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    stage.#resize()
    return stage
  }

  show(story: EngineStory): void {
    this.#story = story
    this.#scene = story.createScene()
    this.#replaceViewPoint()
    this.requestRender()
  }

  reset(): void {
    if (this.#story === null) return
    this.#scene = this.#story.createScene()
    this.#replaceViewPoint()
    this.requestRender()
  }

  requestRender(): void {
    if (this.#frame !== 0) return
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0
      if (this.#scene === null || this.#viewPoint === null) return
      this.#renderer.render(this.#scene.space, this.#viewPoint)
    })
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
    this.#resize()
  }

  #resize(): void {
    const width = Math.max(1, this.#canvas.clientWidth)
    const height = Math.max(1, this.#canvas.clientHeight)
    this.#renderer.setSize(width, height)
    this.#viewPoint?.setAspectRatio(width / height)
    this.requestRender()
  }
}
