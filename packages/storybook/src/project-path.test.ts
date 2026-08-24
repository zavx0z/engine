import {describe, expect, test} from "bun:test"
import {engineProjectBase, projectUrl} from "./project-path"

describe("GitHub Pages project base", () => {
  test("keeps every static URL under /engine/", () => {
    expect(engineProjectBase).toBe("/engine/")
    expect(projectUrl("assets/app.js")).toBe("/engine/assets/app.js")
    expect(projectUrl("/assets/app.js")).toBe("/engine/assets/app.js")
  })
})
