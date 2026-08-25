import {describe, expect, test} from "bun:test"
import {LatestOperation, type LatestOperationCallbacks} from "./latest-operation"

type ViewState = Readonly<{
  status: "loading" | "ready" | "error"
  error: string | null
}>

const view = (): Readonly<{
  get(): ViewState
  callbacks: LatestOperationCallbacks
}> => {
  let state: ViewState = {status: "ready", error: null}
  return {
    get: () => state,
    callbacks: {
      start() {
        state = {...state, status: "loading"}
      },
      success() {
        state = {status: "ready", error: null}
      },
      failure(error) {
        state = {status: "error", error: error instanceof Error ? error.message : String(error)}
      },
    },
  }
}

describe("LatestOperation", () => {
  test("ignores a stale failure after the latest operation succeeds", async () => {
    let rejectFirst: ((error: Error) => void) | undefined
    const first = new Promise<void>((_resolve, reject) => {
      rejectFirst = reject
    })
    const owner = new LatestOperation()
    const rendered = view()

    const stale = owner.run(() => first, rendered.callbacks)
    await expect(owner.run(async () => {}, rendered.callbacks)).resolves.toBe(true)
    rejectFirst?.(new Error("stale failure"))

    await expect(stale).resolves.toBe(false)
    expect(rendered.get()).toEqual({status: "ready", error: null})
  })

  test("a successful latest operation recovers from the previous error", async () => {
    const owner = new LatestOperation()
    const rendered = view()

    await owner.run(async () => {
      throw new Error("current failure")
    }, rendered.callbacks)
    expect(rendered.get()).toEqual({status: "error", error: "current failure"})

    await expect(owner.run(async () => {}, rendered.callbacks)).resolves.toBe(true)
    expect(rendered.get()).toEqual({status: "ready", error: null})
  })
})
