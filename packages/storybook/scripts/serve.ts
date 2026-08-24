import {join, normalize, relative} from "node:path"

const basePath = "/engine/"
const outputRoot = join(import.meta.dir, "../dist")
const port = Number(Bun.env.PORT ?? 4173)

const contentType = (pathname: string): string => {
  if (pathname.endsWith(".html")) return "text/html; charset=utf-8"
  if (pathname.endsWith(".js")) return "text/javascript; charset=utf-8"
  if (pathname.endsWith(".css")) return "text/css; charset=utf-8"
  if (pathname.endsWith(".map")) return "application/json; charset=utf-8"
  if (pathname.endsWith(".ttf")) return "font/ttf"
  return "application/octet-stream"
}

const server = Bun.serve({
  hostname: "127.0.0.1",
  port,
  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname === "/") return Response.redirect(new URL(basePath, url), 302)
    if (!url.pathname.startsWith(basePath)) return new Response("Not found", {status: 404})

    const requested = decodeURIComponent(url.pathname.slice(basePath.length)) || "index.html"
    const candidate = normalize(join(outputRoot, requested))
    if (relative(outputRoot, candidate).startsWith("..")) {
      return new Response("Not found", {status: 404})
    }

    const file = Bun.file(candidate)
    if (!(await file.exists())) return new Response(Bun.file(join(outputRoot, "404.html")))

    const immutable = requested !== "index.html" && requested !== "404.html"
    return new Response(file, {
      headers: {
        "content-type": contentType(requested),
        "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
      },
    })
  },
})

console.log(`[engine storybook] ${server.url}engine/`)
