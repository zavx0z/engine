import {resolveStory, stories, storyHash} from "./catalog"
import {iconMarkup} from "./icons"
import type {EngineStory} from "./story"
import {WebGpuStage} from "./webgpu-stage"

const required = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector)
  if (element === null) throw new Error(`Engine Storybook is missing ${selector}`)
  return element
}

const canvas = required<HTMLCanvasElement>("[data-story-canvas]")
const navigation = required<HTMLElement>("[data-story-navigation]")
const title = required<HTMLElement>("[data-story-title]")
const description = required<HTMLElement>("[data-story-description]")
const tags = required<HTMLElement>("[data-story-tags]")
const source = required<HTMLElement>("[data-story-source]")
const sourceFile = required<HTMLElement>("[data-story-source-file]")
const iconAssociation = required<HTMLElement>("[data-story-icon-association]")
const status = required<HTMLElement>("[data-webgpu-status]")
const errorPanel = required<HTMLElement>("[data-webgpu-error]")
const resetButton = required<HTMLButtonElement>("[data-reset-view]")
const menuButton = required<HTMLButtonElement>("[data-menu-toggle]")
const shell = required<HTMLElement>("[data-shell]")

let stage: WebGpuStage | null = null
let currentStory: EngineStory | null = null

const renderNavigation = (): void => {
  navigation.replaceChildren()
  for (const group of ["Foundations", "Geometry", "Materials"] as const) {
    const section = document.createElement("section")
    section.className = "navigation-group"
    const heading = document.createElement("h2")
    heading.textContent = group
    section.append(heading)

    for (const story of stories.filter((candidate) => candidate.group === group)) {
      const link = document.createElement("a")
      link.className = "story-link"
      link.href = storyHash(story)
      link.dataset.storyId = story.id
      link.innerHTML = `<span class="story-link-icon">${iconMarkup(story.icon)}</span><span>${story.title}</span>`
      link.addEventListener("click", () => shell.removeAttribute("data-menu-open"))
      section.append(link)
    }
    navigation.append(section)
  }
}

const renderMetadata = (story: EngineStory): void => {
  title.textContent = story.title
  description.textContent = story.description
  source.textContent = story.source
  sourceFile.textContent = story.sourceFile
  iconAssociation.textContent = `${story.materialIcon} icon association`
  tags.replaceChildren(...story.tags.map((tag) => {
    const item = document.createElement("li")
    item.textContent = tag
    return item
  }))
  for (const link of document.querySelectorAll<HTMLElement>("[data-story-id]")) {
    const active = link.dataset.storyId === story.id
    link.toggleAttribute("data-active", active)
    if (active) link.setAttribute("aria-current", "page")
    else link.removeAttribute("aria-current")
  }
}

const showStory = (): void => {
  const story = resolveStory(location.hash)
  if (location.hash !== storyHash(story)) history.replaceState(null, "", storyHash(story))
  currentStory = story
  renderMetadata(story)
  stage?.show(story)
}

const initialize = async (): Promise<void> => {
  renderNavigation()
  showStory()
  if (!navigator.gpu) {
    status.textContent = "WebGPU unavailable"
    status.dataset.state = "error"
    errorPanel.hidden = false
    errorPanel.textContent = "This live catalog needs a browser with WebGPU enabled. The source and contracts remain available in the repository."
    return
  }

  try {
    status.textContent = "Initializing WebGPU"
    stage = await WebGpuStage.create(canvas)
    if (currentStory !== null) stage.show(currentStory)
    status.textContent = "Ready · renders on demand"
    status.dataset.state = "ready"
  } catch (error) {
    status.textContent = "WebGPU initialization failed"
    status.dataset.state = "error"
    errorPanel.hidden = false
    errorPanel.textContent = error instanceof Error ? error.message : String(error)
  }
}

window.addEventListener("hashchange", showStory)
resetButton.addEventListener("click", () => stage?.reset())
menuButton.addEventListener("click", () => {
  const open = shell.toggleAttribute("data-menu-open")
  menuButton.setAttribute("aria-expanded", String(open))
})

void initialize()
