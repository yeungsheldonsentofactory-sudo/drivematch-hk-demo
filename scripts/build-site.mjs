import { cp, mkdir, writeFile } from 'node:fs/promises'

await mkdir(new URL('../dist/server/', import.meta.url), { recursive: true })
await mkdir(new URL('../dist/client/', import.meta.url), { recursive: true })
await cp(new URL('../dist/assets/', import.meta.url), new URL('../dist/client/assets/', import.meta.url), { recursive: true, force: true })
await cp(new URL('../dist/index.html', import.meta.url), new URL('../dist/client/index.html', import.meta.url), { force: true })
await writeFile(
  new URL('../dist/server/index.js', import.meta.url),
  `export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.includes('.')) {
      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request))
    }
    return env.ASSETS.fetch(request)
  },
}\n`,
)
