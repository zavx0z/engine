import {
  AxesHelper,
  BoxGeometry,
  Color,
  GridHelper,
  Mesh,
  MeshBasicMaterial,
  Space,
} from "@engine/core"
import type {EngineStory} from "../../story"

export const coordinateSpaceStory: EngineStory = Object.freeze({
  id: "foundations-coordinate-space",
  group: "Foundations",
  title: "Coordinate space",
  icon: "architecture",
  materialIcon: "Hub",
  description: "A retained Z-up scene expressed in millimetres, with a single inherited transform tree.",
  sourceFile: "stories/foundations/coordinate-space.stories.ts",
  tags: ["Z-up", "millimetres", "retained scene"],
  source: `const space = new Space()
space.background = new Color(0x070b12)
space.add(new GridHelper(360, 18))
space.add(new AxesHelper(120))

const box = new Mesh(
  new BoxGeometry({width: 90, height: 70, depth: 60}),
  new MeshBasicMaterial({color: 0x79a7ff}),
)
box.position.z = 30
space.add(box)`,
  createScene() {
    const space = new Space()
    space.background = new Color(0x070b12)
    space.add(new GridHelper(360, 18, 0x7397d4, 0x243249))
    space.add(new AxesHelper(120))

    const box = new Mesh(
      new BoxGeometry({width: 90, height: 70, depth: 60}),
      new MeshBasicMaterial({color: 0x79a7ff}),
    )
    box.position.z = 30
    box.rotation.set(0.32, 0.18, 0.22)
    space.add(box)

    return {
      space,
      camera: {
        position: {x: 190, y: -240, z: 170},
        target: {x: 0, y: 0, z: 30},
        near: 1,
        far: 1200,
      },
    }
  },
})
