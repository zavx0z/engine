import {createHash} from "node:crypto"
import {mkdtemp, readFile, rm} from "node:fs/promises"
import {tmpdir} from "node:os"
import {resolve} from "node:path"

const sourceUrl = "https://api.github.com/repos/blender/blender/contents/release/datafiles/fonts/Inter.woff2?ref=v5.2.0"
const sourceGitBlob = "0700d24d00b81b79341a9bcee761c64768111813"
const sourceSha256 = "fb865a5087637ba194b14aef6f0558214f3c4b3ec939e3c0812c66de41036a47"
const outputSha256 = "b9ed74423726fa341f0701cea0ec610deda96da5627e85b361bf3031538dc38f"
const outputPath = resolve(import.meta.dir, "../../packages/core/static/fonts/inter-regular.ttf")

const workDirectory = await mkdtemp(resolve(tmpdir(), "engine-inter-"))
const sourcePath = resolve(workDirectory, "Inter.woff2")
const generatedPath = resolve(workDirectory, "inter-regular.ttf")

try {
  const response = await fetch(sourceUrl, {
    headers: {Accept: "application/vnd.github+json"},
  })
  if (!response.ok) throw new Error(`Blender font source request failed: ${response.status} ${response.statusText}`)

  const sourceRecord = await response.json() as {content?: string; encoding?: string; sha?: string}
  if (sourceRecord.sha !== sourceGitBlob) {
    throw new Error(`Blender v5.2.0 Inter Git blob changed: expected ${sourceGitBlob}, received ${sourceRecord.sha ?? "none"}`)
  }
  if (sourceRecord.encoding !== "base64" || sourceRecord.content === undefined) {
    throw new Error("Blender font source response does not contain base64 bytes")
  }

  const source = Buffer.from(sourceRecord.content.replaceAll("\n", ""), "base64")
  assertSha256("Blender v5.2.0 Inter.woff2", source, sourceSha256)
  await Bun.write(sourcePath, source)

  const toolVersion = Bun.spawnSync(["hb-subset", "--version"])
  if (toolVersion.exitCode !== 0) {
    throw new Error("hb-subset is required; install the MacPorts harfbuzz port")
  }

  const conversion = Bun.spawnSync([
    "hb-subset",
    sourcePath,
    "--face-loader=ft",
    "--keep-everything",
    "--variations=wght=400",
    `--output-file=${generatedPath}`,
  ])
  if (conversion.exitCode !== 0) {
    throw new Error(`hb-subset failed: ${conversion.stderr.toString().trim()}`)
  }

  const generated = await readFile(generatedPath)
  assertSha256("generated inter-regular.ttf", generated, outputSha256)
  await Bun.write(outputPath, generated)

  console.log(`Wrote ${outputPath}`)
  console.log(`Source SHA-256: ${sourceSha256}`)
  console.log(`Output SHA-256: ${outputSha256}`)
  console.log(toolVersion.stdout.toString().trim())
} finally {
  await rm(workDirectory, {recursive: true, force: true})
}

function assertSha256(label: string, bytes: Uint8Array, expected: string): void {
  const actual = createHash("sha256").update(bytes).digest("hex")
  if (actual !== expected) throw new Error(`${label} SHA-256 mismatch: expected ${expected}, received ${actual}`)
}
