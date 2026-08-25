import {copyFile, mkdir, rm, writeFile} from "node:fs/promises"
import {join} from "node:path"

const packageRoot = join(import.meta.dir, "..")
const sourceRoot = join(packageRoot, "src")
const outputRoot = join(packageRoot, "dist")
const fontOutputRoot = join(outputRoot, "fonts")
const defaultFontSource = join(packageRoot, "../core/static/fonts/jetbrains-mono-bold.ttf")

await rm(outputRoot, {recursive: true, force: true})
await mkdir(outputRoot, {recursive: true})
await mkdir(fontOutputRoot, {recursive: true})

const result = await Bun.build({
  entrypoints: [join(sourceRoot, "index.html")],
  outdir: outputRoot,
  target: "browser",
  format: "esm",
  minify: true,
  publicPath: "/engine/",
  external: ["/engine/fonts/jetbrains-mono-bold.ttf"],
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
await copyFile(defaultFontSource, join(fontOutputRoot, "jetbrains-mono-bold.ttf"))
await writeFile(join(outputRoot, ".nojekyll"), "")

const outputs = result.outputs.map((output) => output.path.replace(`${outputRoot}/`, ""))
console.log(`[engine storybook] built ${outputs.length + 1} assets for /engine/`)
