import {startStorybookHubServer} from "@zavx0z/storybook/server"
import {
  createEngineStorybookApp,
  engineStorybookStaticFiles,
} from "../src/storybook-app"

const server = startStorybookHubServer({
  app: createEngineStorybookApp(),
  hostname: Bun.env.ENGINE_STORYBOOK_HOST ?? "127.0.0.1",
  port: Number(Bun.env.ENGINE_STORYBOOK_PORT ?? 4173),
  staticFiles: engineStorybookStaticFiles(),
})

console.log(`[Engine Storybook] ${server.url}engine/`)
