# Handoff CMS

Add a content editor to any vibe-coded Next.js site in under 2 minutes.

```
npx handoff init  →  scan your code  →  wrap content  →  get an editor at /handoff
```

**Status:** Working proof-of-concept. Not production-ready.

## What it does

You vibe-code a site with Cursor / Bolt / Lovable / v0. Your client asks "how do I change the headline?" — Handoff solves that.

The CLI scans your Next.js project, finds hardcoded text (headings, paragraphs, links, images), wraps them with `<Editable>` components, and generates a content editor at `/handoff` on your site. Your client edits text in a clean UI. Changes are saved to a JSON file and appear on the site immediately.

**No external services. No database. No auth. Just files.**

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/daumantaskodina/handoff-cms.git
cd handoff-cms/cli
npm install

# 2. Run on your Next.js project
node init.mjs /path/to/your/nextjs-project

# 3. Start your project
cd /path/to/your/nextjs-project
npm run dev

# 4. Open the editor
# http://localhost:3000/handoff
```

## What gets created in your project

```
your-project/
├── handoff/content.json              ← Content data (commit this)
├── src/lib/handoff/components.tsx     ← <Editable> components
├── src/app/api/handoff/route.ts      ← Content API
└── src/app/handoff/page.tsx          ← Editor UI
```

Your `page.tsx` files are modified to wrap text with `<Editable>` components. All original styles and classes are preserved.

## Requirements

- Node.js 18+
- Next.js 14+ with App Router
- Server Components (the default — no `'use client'` on page files)
- Hardcoded text in JSX

## How it works

**Scanner** — Parses your JSX with Babel, finds text inside content elements (`h1`-`h6`, `p`, `a`, `blockquote`, etc.), classifies each string as content or code.

**Codemod** — Wraps detected content with `<Editable>` components that read from a JSON content store. Falls back to the original hardcoded text if the content store is empty.

**Editor** — A form-based UI at `/handoff` that reads/writes `handoff/content.json` via an API route. Grouped by page section.

**Content delivery** — `<Editable>` is a React Server Component that reads `handoff/content.json` with `readFileSync`. No client-side JavaScript. No hydration issues. No API calls in production.

## Example

**Before** (your vibe-coded page):
```jsx
<h1 className="text-4xl font-bold">Build faster with AI</h1>
<p className="text-gray-500">Ship websites in hours, not weeks.</p>
```

**After** (`handoff init`):
```jsx
import { Editable } from "@/lib/handoff/components"

<Editable field="hero.title" tag="h1" className="text-4xl font-bold">
  Build faster with AI
</Editable>
<Editable field="hero.description" tag="p" className="text-gray-500">
  Ship websites in hours, not weeks.
</Editable>
```

The editor at `/handoff` shows these fields. Edit, save, refresh — done.

## Limitations (PoC)

- Only scans `page.tsx` files (not extracted components)
- Only works with Next.js App Router Server Components
- No repeatable sections (can't add/remove list items)
- No rich text editing
- No visual editing (form-based only)
- Section naming is basic

See [docs/setup-guide.md](docs/setup-guide.md) for the full compatibility guide.

## Project structure

```
handoff-cms/
├── cli/                  ← The CLI tool
│   ├── init.mjs          ← Entry point
│   ├── scanner.mjs       ← AST content scanner
│   ├── codemod.mjs       ← Code transformer
│   └── templates/        ← Files injected into your project
├── fixtures/test-site/   ← Sample Next.js project for testing
└── docs/                 ← Setup guide and documentation
```

## Docs

- [Setup Guide](docs/setup-guide.md) — Full compatibility guide, tips, and troubleshooting

## License

MIT
