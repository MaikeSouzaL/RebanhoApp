// Gera os ícones do PWA a partir da logo da igreja (image.png na raiz).
// Uso: npm run gen:icons
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'image.png')
const outDir = path.join(root, 'public', 'icons')

// Creme de fundo (token --background) para preencher a área do ícone.
const CREME = { r: 247, g: 244, b: 236, alpha: 1 }

async function run() {
  await mkdir(outDir, { recursive: true })

  // Ícone padrão: logo sobre fundo creme, com respiro leve.
  for (const size of [192, 512]) {
    const pad = Math.round(size * 0.08)
    const inner = size - pad * 2
    const logo = await sharp(source)
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer()
    await sharp({
      create: { width: size, height: size, channels: 4, background: CREME },
    })
      .composite([{ input: logo, gravity: 'center' }])
      .png()
      .toFile(path.join(outDir, `icon-${size}.png`))
  }

  // Maskable: respiro maior (safe zone ~20%) para não cortar em ícones circulares.
  {
    const size = 512
    const pad = Math.round(size * 0.2)
    const inner = size - pad * 2
    const logo = await sharp(source)
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer()
    await sharp({
      create: { width: size, height: size, channels: 4, background: CREME },
    })
      .composite([{ input: logo, gravity: 'center' }])
      .png()
      .toFile(path.join(outDir, `maskable-512.png`))
  }

  // apple-touch-icon (180) em public/
  {
    const size = 180
    const pad = Math.round(size * 0.08)
    const inner = size - pad * 2
    const logo = await sharp(source)
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer()
    await sharp({ create: { width: size, height: size, channels: 4, background: CREME } })
      .composite([{ input: logo, gravity: 'center' }])
      .png()
      .toFile(path.join(root, 'public', 'apple-touch-icon.png'))
  }

  // Cópia da logo original em public/ para uso na UI (emblema).
  await sharp(source).resize(640, 640, { fit: 'inside' }).png().toFile(path.join(root, 'public', 'emblema.png'))

  console.log('✓ Ícones gerados em public/icons e public/')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
