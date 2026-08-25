import {
  Color,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  type PresentationClipShape,
  RoundedRectMaterial,
  Space,
  Text,
  TextMaterial,
} from "@engine/core"
import {loadDocumentDefaultFont} from "@engine/core/default-font"
import type {EngineStory} from "../../story"

const PANEL_WIDTH = 270
const PANEL_HEIGHT = 200
const PANEL_RADIUS = 24

const panel = (x: number, fill: number): Readonly<{mesh: Mesh; clip: PresentationClipShape}> => {
  const mesh = new Mesh(
    new PlaneGeometry({width: PANEL_WIDTH, height: PANEL_HEIGHT}),
    new RoundedRectMaterial({
      width: PANEL_WIDTH,
      height: PANEL_HEIGHT,
      radius: PANEL_RADIUS,
      fill,
      border: 0x5f7694,
      borderWidth: 2,
    }),
  )
  mesh.position.set(x, 0, 0)
  const clip: PresentationClipShape = {
    kind: "rounded-rect",
    coordinateSpace: mesh,
    center: [0, 0],
    halfSize: [PANEL_WIDTH / 2, PANEL_HEIGHT / 2],
    radii: [PANEL_RADIUS, PANEL_RADIUS, PANEL_RADIUS, PANEL_RADIUS],
  }
  return {mesh, clip}
}

export const textStencilClippingStory: EngineStory = Object.freeze({
  id: "text-stencil-clipping",
  group: "Text",
  title: "Stencil-обрезка текста",
  icon: "text",
  materialIcon: "TextFields",
  description: "Две отдельные скруглённые панели задают public presentation clips. Пиксели длинной левой строки физически доходят до правой области, но rounded clip удаляет их до stencil и cover; на той же высоте остаётся только независимый CLEAN LABEL. Подписи вынесены отдельной строкой.",
  sourceFile: "stories/text/stencil-clipping.stories.ts",
  tags: ["presentation clip", "rounded clip chain", "text stencil"],
  source: `const leftClip: PresentationClipShape = {
  kind: "rounded-rect",
  coordinateSpace: leftPanel,
  center: [0, 0],
  halfSize: [135, 100],
  radii: [24, 24, 24, 24],
}

overflow.presentationClips = [leftClip]
cleanLabel.presentationClips = [rightClip]`,
  async createScene() {
    const font = await loadDocumentDefaultFont()
    const space = new Space()
    space.background = new Color(0x090c12)

    const left = panel(-142, 0x162a45)
    const right = panel(142, 0x173a2e)
    space.add(left.mesh)
    space.add(right.mesh)

    const divider = new Mesh(
      new PlaneGeometry({width: 4, height: 220}),
      new MeshBasicMaterial({color: 0x91a5c3}),
    )
    divider.position.z = 1
    space.add(divider)

    const leftCaption = new Text(
      "LEFT · ROUNDED PIXEL CLIP",
      font,
      14,
      new TextMaterial({color: 0xb8c6da}),
    )
    leftCaption.position.set(-250, 58, 3)
    leftCaption.presentationClips = [left.clip]
    space.add(leftCaption)

    const rightCaption = new Text(
      "RIGHT · INDEPENDENT COVER",
      font,
      14,
      new TextMaterial({color: 0xb8d8cd}),
    )
    rightCaption.position.set(25, 58, 3)
    rightCaption.presentationClips = [right.clip]
    space.add(rightCaption)

    const lineY = -30
    const overflow = new Text(
      "LEFT OVERFLOW MUST STOP AT THE ROUNDED PANEL · OVERFLOW OVERFLOW OVERFLOW",
      font,
      28,
      new TextMaterial({color: 0x79a7ff}),
    )
    overflow.position.set(-250, lineY, 3)
    overflow.presentationClips = [left.clip]
    space.add(overflow)

    const cleanLabel = new Text(
      "CLEAN LABEL",
      font,
      28,
      new TextMaterial({color: 0x8af0cf}),
    )
    cleanLabel.position.set(25, lineY, 3)
    cleanLabel.presentationClips = [right.clip]
    space.add(cleanLabel)

    return {
      space,
      camera: {
        position: {x: 0, y: 0, z: 480},
        target: {x: 0, y: 0, z: 0},
        near: 1,
        far: 1200,
      },
    }
  },
})
