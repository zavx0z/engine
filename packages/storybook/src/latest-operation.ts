export type LatestOperationCallbacks = Readonly<{
  start(): void
  success(): void
  failure(error: unknown): void
}>

export class LatestOperation {
  #token = 0

  async run(
    operation: () => Promise<void>,
    callbacks: LatestOperationCallbacks,
  ): Promise<boolean> {
    const token = ++this.#token
    callbacks.start()
    try {
      await operation()
      if (token !== this.#token) return false
      callbacks.success()
      return true
    } catch (error) {
      if (token !== this.#token) return false
      callbacks.failure(error)
      return true
    }
  }
}
