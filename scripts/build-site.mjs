import { cp, mkdir, writeFile } from 'node:fs/promises'

await mkdir(new URL('../dist/server/', import.meta.url), { recursive: true })
await mkdir(new URL('../dist/client/', import.meta.url), { recursive: true })
await cp(new URL('../dist/assets/', import.meta.url), new URL('../dist/client/assets/', import.meta.url), { recursive: true, force: true })
await cp(new URL('../dist/index.html', import.meta.url), new URL('../dist/client/index.html', import.meta.url), { force: true })
await cp(new URL('../dist/robots.txt', import.meta.url), new URL('../dist/client/robots.txt', import.meta.url), { force: true })
await cp(new URL('../dist/sitemap.xml', import.meta.url), new URL('../dist/client/sitemap.xml', import.meta.url), { force: true })
await writeFile(new URL('../dist/client/_headers', import.meta.url), `/*
  Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https://upload.wikimedia.org https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Strict-Transport-Security: max-age=31536000; includeSubDomains
`)
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
