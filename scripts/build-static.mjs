import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import * as esbuild from 'esbuild'
import { createClient } from '@supabase/supabase-js'

const dist = new URL('../dist/', import.meta.url)
const assets = new URL('../dist/assets/', import.meta.url)

await rm(dist, { recursive: true, force: true })
await mkdir(assets, { recursive: true })
await esbuild.build({
  entryPoints: [new URL('../src/main.jsx', import.meta.url).pathname],
  bundle: true,
  format: 'esm',
  outdir: assets.pathname,
  entryNames: 'index-[hash]',
  minify: true,
  jsx: 'automatic',
  publicPath: 'assets',
  logLevel: 'info',
})
await esbuild.stop()
await cp(new URL('../public/assets/', import.meta.url), assets, { recursive: true, force: true })

const files = await readdir(assets)
const script = files.find((file) => /^index-.*\.js$/.test(file))
const stylesheet = files.find((file) => /^index-.*\.css$/.test(file))
if (!script || !stylesheet) throw new Error('Static build did not produce the required JS and CSS files.')

await writeFile(new URL('../dist/index.html', import.meta.url), `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#13263e" />
    <meta name="description" content="ALPHA Motor Gallery 香港精選現貨汽車買賣平台，提供透明車況資料、專業車輛相簿及預約睇車服務。" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="ALPHA Motor Gallery · 精選現貨汽車" />
    <meta property="og:description" content="香港精選現貨車盤，透明車況資料、預約睇車及專人跟進。" />
    <meta property="og:locale" content="zh_HK" />
    <meta property="og:url" content="https://alphamotor.pages.dev/" />
    <meta property="og:image" content="https://alphamotor.pages.dev/assets/supercar-sf90.png" />
    <meta property="og:image:width" content="1448" />
    <meta property="og:image:height" content="1086" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="https://alphamotor.pages.dev/assets/supercar-sf90.png" />
    <title>ALPHA Motor Gallery · 精選現貨汽車</title>
    <link rel="stylesheet" href="assets/${stylesheet}" />
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"AutoDealer","name":"ALPHA Motor Gallery","description":"香港精選現貨汽車買賣平台","areaServed":"Hong Kong","url":"https://alphamotor.pages.dev/"}</script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="assets/${script}"></script>
  </body>
</html>
`)

await writeFile(new URL('../dist/robots.txt', import.meta.url), `User-agent: *
Allow: /
Sitemap: https://alphamotor.pages.dev/sitemap.xml
`)

const sitemapSupabase = createClient(
  'https://bxbzzfxsxxuccailnkxf.supabase.co',
  'sb_publishable_lWQU_awvFFN6gIzoLn5TAw_lUjyLnnr',
)
let vehicleUrls = []
try {
  const { data, error } = await sitemapSupabase
    .from('vehicles')
    .select('id, published_at')
    .eq('status', 'published')
  if (error) throw error
  vehicleUrls = (data ?? []).map(
    (v) =>
      `  <url><loc>https://alphamotor.pages.dev/?car=${v.id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
  )
  console.log(`sitemap: included ${vehicleUrls.length} published vehicle(s)`)
} catch (err) {
  console.warn('sitemap: failed to fetch vehicles from Supabase, falling back to homepage-only sitemap.', err)
}

await writeFile(new URL('../dist/sitemap.xml', import.meta.url), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://alphamotor.pages.dev/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
${vehicleUrls.join('\n')}
</urlset>
`)

await import('./build-site.mjs')
