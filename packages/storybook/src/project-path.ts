export const engineProjectBase = "/engine/"

export function projectUrl(relativePath = ""): string {
  const clean = relativePath.replace(/^\/+/, "")
  return `${engineProjectBase}${clean}`
}
