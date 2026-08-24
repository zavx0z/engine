import {
  Color,
  GridHelper,
  Mesh,
  MeshBasicMaterial,
  Space,
  SphereGeometry,
  ThinFilmMaterial,
} from "@engine/core"
import type {EngineStory} from "../../story"

export const thinFilmSphereStory: EngineStory = Object.freeze({
  id: "materials-thin-film-sphere",
  group: "Materials",
  title: "Thin-film sphere",
  icon: "thin-film",
  materialIcon: "BlurOn",
  description: "A closed surface with analytical Fresnel, spectral interference, bounded highlights, and no post-processing.",
  sourceFile: "stories/materials/thin-film-sphere.stories.ts",
  tags: ["thin film", "Fresnel", "one pass"],
  source: `const shell = new Mesh(
  new SphereGeometry({radius: 72, widthSegments: 48, heightSegments: 32}),
  new ThinFilmMaterial({
    color: 0x4ecbff,
    rimColor: 0xf1fbff,
    opacity: 0.5,
    iridescence: 0.88,
    highlightSize: 0.42,
  }),
)
space.add(shell)`,
  createScene() {
    const space = new Space()
    space.background = new Color(0x05070e)
    space.add(new GridHelper(420, 21, 0x5d648e, 0x20243c))

    const core = new Mesh(
      new SphereGeometry({radius: 55, widthSegments: 36, heightSegments: 24}),
      new MeshBasicMaterial({color: 0x11172a}),
    )
    core.position.z = 78
    space.add(core)

    const shell = new Mesh(
      new SphereGeometry({radius: 72, widthSegments: 48, heightSegments: 32}),
      new ThinFilmMaterial({
        color: 0x4ecbff,
        rimColor: 0xf1fbff,
        opacity: 0.5,
        rimStrength: 1.8,
        iridescence: 0.88,
        filmThickness: 0.84,
        highlightSize: 0.42,
      }),
    )
    shell.position.z = 78
    space.add(shell)

    return {
      space,
      camera: {
        position: {x: 220, y: -280, z: 205},
        target: {x: 0, y: 0, z: 78},
        near: 1,
        far: 1400,
      },
    }
  },
})
