import {startStorybookPackageServer} from "@zavx0z/storybook/server"
import {
  createEngineStorybookApp,
  engineStorybookStaticFiles,
} from "../src/storybook-app"

startStorybookPackageServer({
  app: createEngineStorybookApp(),
  staticFiles: engineStorybookStaticFiles(),
})
