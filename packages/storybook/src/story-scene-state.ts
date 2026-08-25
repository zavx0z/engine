import type {EngineStory, StoryScene} from "./story"

export class StorySceneState {
  #story: EngineStory | null = null
  #version = 0

  async show(story: EngineStory): Promise<StoryScene | null> {
    const version = ++this.#version
    this.#story = story
    try {
      const scene = await story.createScene()
      return version === this.#version ? scene : null
    } catch (error) {
      if (version !== this.#version) return null
      throw error
    }
  }

  async reset(): Promise<StoryScene | null> {
    if (this.#story === null) return null
    return this.show(this.#story)
  }
}
