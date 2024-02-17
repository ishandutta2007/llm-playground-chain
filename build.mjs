import autoprefixer from 'autoprefixer'
import * as dotenv from 'dotenv'
import esbuild from 'esbuild'
import fs from 'fs-extra'
import process from 'node:process'
import tailwindcss from 'tailwindcss'

dotenv.config()

const outdir = 'dist'

async function deleteOldDir() {
  await fs.remove(outdir)
}

async function runEsbuild() {
  await esbuild.build({
    entryPoints: [
      'src/index.ts',
    ],
    bundle: true,
    outdir: outdir,
    treeShaking: true,
    // minify: true,
    // drop: ['console', 'debugger'],
    legalComments: 'none',
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.AXIOM_TOKEN': JSON.stringify(process.env.AXIOM_TOKEN || 'UNDEFINED'),
    },
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsx: 'automatic',
    loader: {
      '.png': 'dataurl',
      '.svg': 'dataurl',
    },
    plugins: [
    ],
  })
}

async function build() {
  await deleteOldDir()
  await runEsbuild()
  console.log('Build success.')
}

build()
