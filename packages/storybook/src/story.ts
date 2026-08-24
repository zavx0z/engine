import type {Space} from "@engine/core"
import type {StoryIcon} from "./icons"

export type CameraPreset = Readonly<{
  position: Readonly<{x: number; y: number; z: number}>
  target: Readonly<{x: number; y: number; z: number}>
  near?: number
  far?: number
}>

export type StoryScene = Readonly<{
  space: Space
  camera: CameraPreset
}>

export type EngineStory = Readonly<{
  id: string
  group: "Foundations" | "Geometry" | "Materials"
  title: string
  icon: StoryIcon
  materialIcon: string
  description: string
  sourceFile: string
  tags: readonly string[]
  source: string
  createScene(): StoryScene
}>
