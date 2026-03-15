#!/usr/bin/env node

/**
 * Handoff CLI — PoC version
 *
 * Usage: node cli/init.mjs [path-to-nextjs-project]
 *
 * Scans a Next.js project, detects editable content,
 * wraps it with <Editable> components, and generates
 * an editor UI at /handoff.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs'
import { join, dirname, relative, resolve } from 'path'
import { glob } from 'glob'
import { scanFile } from './scanner.mjs'
import { applyCodemod, generateContentJson } from './codemod.mjs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// --- Helpers ---

function log(msg) { console.log(`  ${msg}`) }
function logStep(msg) { console.log(`\n✓ ${msg}`) }
function logError(msg) { console.error(`\n✗ ${msg}`) }

// --- Main ---

async function main() {
  const projectPath = resolve(process.argv[2] || '.')

  console.log('\n  ╔═══════════════════════════════╗')
  console.log('  ║     Handoff CMS — PoC Init    ║')
  console.log('  ╚═══════════════════════════════╝\n')

  // 1. Detect framework
  const hasNextConfig = existsSync(join(projectPath, 'next.config.mjs')) ||
                        existsSync(join(projectPath, 'next.config.js')) ||
                        existsSync(join(projectPath, 'next.config.ts'))

  if (!hasNextConfig) {
    logError('No next.config found. This PoC only supports Next.js projects.')
    process.exit(1)
  }

  logStep('Detected Next.js project')

  // 2. Find page files
  const appDir = existsSync(join(projectPath, 'src', 'app'))
    ? join(projectPath, 'src', 'app')
    : existsSync(join(projectPath, 'app'))
      ? join(projectPath, 'app')
      : null

  if (!appDir) {
    logError('No app/ or src/app/ directory found. App Router is required.')
    process.exit(1)
  }

  const pageFiles = await glob('**/page.{tsx,jsx,ts,js}', {
    cwd: appDir,
    absolute: true,
    ignore: ['**/handoff/**', '**/api/**', '**/node_modules/**'],
  })

  logStep(`Found ${pageFiles.length} page(s)`)
  for (const f of pageFiles) {
    log(`  ${relative(projectPath, f)}`)
  }

  // 3. Scan all pages for content
  let allFields = []

  for (const pagePath of pageFiles) {
    const code = readFileSync(pagePath, 'utf-8')
    const fields = scanFile(code, relative(projectPath, pagePath))
    allFields.push(...fields)
  }

  logStep(`Detected ${allFields.length} editable field(s)`)
  console.log('')

  // Group by section for display
  const bySection = {}
  for (const field of allFields) {
    if (!bySection[field.section]) bySection[field.section] = []
    bySection[field.section].push(field)
  }

  for (const [section, fields] of Object.entries(bySection)) {
    console.log(`  ── ${section} ──`)
    for (const f of fields) {
      const preview = f.type === 'image'
        ? `[image] ${f.value}`
        : f.value.length > 60 ? f.value.slice(0, 57) + '...' : f.value
      console.log(`    ${f.field} (${f.tag}): "${preview}"`)
    }
    console.log('')
  }

  // 4. Generate content JSON
  const contentJson = generateContentJson(allFields)
  const handoffDir = join(projectPath, 'handoff')
  mkdirSync(handoffDir, { recursive: true })
  writeFileSync(
    join(handoffDir, 'content.json'),
    JSON.stringify(contentJson, null, 2)
  )
  logStep('Generated handoff/content.json')

  // 5. Copy SDK components into the project
  const libDir = join(appDir, '..', 'lib', 'handoff')
  mkdirSync(libDir, { recursive: true })
  copyFileSync(
    join(__dirname, 'templates', 'components.tsx'),
    join(libDir, 'components.tsx')
  )
  logStep(`Created ${relative(projectPath, join(libDir, 'components.tsx'))}`)

  // 6. Generate API route
  const apiDir = join(appDir, 'api', 'handoff')
  mkdirSync(apiDir, { recursive: true })
  copyFileSync(
    join(__dirname, 'templates', 'api-route.ts'),
    join(apiDir, 'route.ts')
  )
  logStep(`Created ${relative(projectPath, join(apiDir, 'route.ts'))}`)

  // 7. Generate editor page
  const editorDir = join(appDir, 'handoff')
  mkdirSync(editorDir, { recursive: true })
  copyFileSync(
    join(__dirname, 'templates', 'editor-page.tsx'),
    join(editorDir, 'page.tsx')
  )
  logStep(`Created ${relative(projectPath, join(editorDir, 'page.tsx'))}`)

  // 8. Apply codemod to page files
  logStep('Applying codemod...')
  for (const pagePath of pageFiles) {
    const code = readFileSync(pagePath, 'utf-8')
    const pageRelPath = relative(projectPath, pagePath)
    const pageFields = allFields.filter(f => f.filePath === pageRelPath)

    if (pageFields.length === 0) continue

    try {
      const transformed = applyCodemod(code, pageFields)
      writeFileSync(pagePath, transformed)
      log(`  Modified: ${pageRelPath} (${pageFields.length} fields)`)
    } catch (err) {
      logError(`  Failed to transform ${pageRelPath}: ${err.message}`)
    }
  }

  // 9. Done!
  console.log('\n  ──────────────────────────────────')
  console.log('  ✅ Handoff CMS initialized!')
  console.log('')
  console.log('  Next steps:')
  console.log(`    1. Run: cd ${relative(process.cwd(), projectPath)} && npm run dev`)
  console.log('    2. Open: http://localhost:3000/handoff')
  console.log('    3. Edit content and hit "Save & Publish"')
  console.log('    4. Refresh your site to see changes')
  console.log('')
  console.log('  Files created:')
  console.log('    handoff/content.json        — your content data')
  console.log('    src/lib/handoff/components.tsx — Editable components')
  console.log('    src/app/api/handoff/route.ts — content API')
  console.log('    src/app/handoff/page.tsx     — editor UI')
  console.log('  ──────────────────────────────────\n')
}

main().catch(err => {
  logError(err.message)
  process.exit(1)
})
