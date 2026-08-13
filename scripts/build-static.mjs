import { execFile } from 'node:child_process'
import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'

const dist = new URL('../dist/', import.meta.url)
const assets = new URL('../dist/assets/', import.meta.url)

await rm(dist, { recursive: true, force: true })
await mkdir(assets, { recursive: true })
const run = promisify(execFile)
await run(new URL('../node_modules/@esbuild/darwin-arm64/bin/esbuild', import.meta.url).pathname, [
  'src/main.jsx', '--bundle', '--format=esm', `--outdir=${assets.pathname}`,
  '--entry-names=index-[hash]', '--minify', '--jsx=automatic', '--public-path=assets',
])
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
    <meta name="twitter:card" content="summary_large_image" />
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

await import('./build-site.mjs')
