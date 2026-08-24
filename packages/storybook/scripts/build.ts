import {copyFile, mkdir, rm, writeFile} from "node:fs/promises"
import {join} from "node:path"

const packageRoot = join(import.meta.dir, "..")
const sourceRoot = join(packageRoot, "src")
const outputRoot = join(packageRoot, "dist")

await rm(outputRoot, {recursive: true, force: true})
await mkdir(outputRoot, {recursive: true})

const result = await Bun.build({
  entrypoints: [join(sourceRoot, "index.html")],
  outdir: outputRoot,
  target: "browser",
  format: "esm",
  minify: true,
  publicPath: "/engine/",
  loader: {
    ".wgsl": "text",
  },
})

if (!result.success) {
  for (const message of result.logs) console.error(message)
  throw new Error("Engine Storybook build failed")
}

const indexPath = join(outputRoot, "index.html")
await copyFile(indexPath, join(outputRoot, "404.html"))
await writeFile(join(outputRoot, ".nojekyll"), "")

const outputs = result.outputs.map((output) => output.path.replace(`${outputRoot}/`, ""))
console.log(`[engine storybook] built ${outputs.length} assets for /engine/`)
