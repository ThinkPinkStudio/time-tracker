#!/usr/bin/env node
'use strict'

const { Resvg } = require('@resvg/resvg-js')
const pngToIco  = require('png-to-ico')
const fs   = require('fs')
const path = require('path')

const assetsDir = path.join(__dirname, '..', 'assets')
const svgPath   = path.join(assetsDir, 'logo.svg')

async function main() {
  const svg    = fs.readFileSync(svgPath)
  const resvg  = new Resvg(svg, { fitTo: { mode: 'width', value: 1024 } })
  const pngBuf = Buffer.from(resvg.render().asPng())

  fs.writeFileSync(path.join(assetsDir, 'logo.png'), pngBuf)
  console.log('✓ assets/logo.png (1024×1024)')

  const icoBuf = await pngToIco(pngBuf)
  fs.writeFileSync(path.join(assetsDir, 'logo.ico'), icoBuf)
  console.log('✓ assets/logo.ico')
}

main().catch(err => { console.error(err); process.exit(1) })
