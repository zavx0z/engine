import {
  Color,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Space,
  Text,
  TextMaterial,
} from "@engine/core"
import {loadDocumentDefaultFont} from "@engine/core/default-font"
import type {EngineStory} from "../../story"

const panel = (x: number, color: number): Mesh => {
  const mesh = new Mesh(
    new PlaneGeometry({width: 260, height: 150}),
    new MeshBasicMaterial({color}),
  )
  mesh.position.set(x, 0, 0)
  return mesh
}

export const textStencilClippingStory: EngineStory = Object.freeze({
  id: "text-stencil-clipping",
  group: "Text",
  title: "Stencil-обрезка текста",
  icon: "text",
  materialIcon: "TextFields",
  description: "Длинная строка обязана закончиться на вертикальном split. Справа остаётся только независимая подпись; любые ghost-фрагменты означают регрессию stencil/cover clipping.",
  sourceFile: "stories/text/stencil-clipping.stories.ts",
  tags: ["framebuffer clip", "stencil pass", "independent cover"],
  source: `const clipped = new Text(longValue, font, 28, clippedMaterial)
const neighbor = new Text("CLEAN LABEL", font, 28, neighborMaterial)

resize(({width, height}) => {
  const split = Math.floor(width / 2)
  clipped.clipBounds = [0, 0, split, height]
  neighbor.clipBounds = [split, 0, width, height]
})`,
  async createScene() {
    const font = await loadDocumentDefaultFont()
    const space = new Space()
    space.background = new Color(0x090c12)
    space.add(panel(-140, 0x101a2a))
    space.add(panel(140, 0x10251f))

    const divider = new Mesh(
      new PlaneGeometry({width: 3, height: 170}),
      new MeshBasicMaterial({color: 0x5d708c}),
    )
    divider.position.z = 1
    space.add(divider)

    const leftCaption = new Text(
      "CLIPPED AT SPLIT",
      font,
      14,
      new TextMaterial({color: 0xb8c6da}),
    )
    leftCaption.position.set(-250, 48, 3)
    space.add(leftCaption)

    const rightCaption = new Text(
      "ONLY THE LABEL BELOW",
      font,
      14,
      new TextMaterial({color: 0xb8d8cd}),
    )
    rightCaption.position.set(22, 48, 3)
    space.add(rightCaption)

    const clipped = new Text(
      "CLIPPED TEXT STOPS HERE  OVERFLOW OVERFLOW OVERFLOW",
      font,
      28,
      new TextMaterial({color: 0x79a7ff}),
    )
    clipped.position.set(-250, -8, 3)
    space.add(clipped)

    const neighbor = new Text(
      "CLEAN LABEL",
      font,
      28,
      new TextMaterial({color: 0x8af0cf}),
    )
    neighbor.position.set(22, -8, 4)
    space.add(neighbor)

    return {
      space,
      camera: {
        position: {x: 0, y: -150, z: 430},
        target: {x: 0, y: 0, z: 0},
        near: 1,
        far: 1200,
      },
      resize({width, height}) {
        const split = Math.floor(width / 2)
        leftCaption.clipBounds = [0, 0, split, height]
        rightCaption.clipBounds = [split, 0, width, height]
        clipped.clipBounds = [0, 0, split, height]
        neighbor.clipBounds = [split, 0, width, height]
      },
    }
  },
})
