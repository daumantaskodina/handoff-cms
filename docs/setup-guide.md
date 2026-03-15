# Handoff CMS — Setup Guide

Add a content editor to your vibe-coded site in under 2 minutes.

---

## Requirements

- **Node.js 18+**
- **Next.js 14+** with App Router (`src/app/` or `app/` directory)
- Pages must be **Server Components** (the default — no `'use client'` at the top of page files)
- Content must be **hardcoded text** in JSX (not fetched from an API or passed as props)

## Quick Start

### 1. Clone the Handoff CLI (one time)

```bash
git clone <this-repo-url> ~/handoff-cli
cd ~/handoff-cli/cli
npm install
```

### 2. Run it on your project

```bash
node ~/handoff-cli/cli/init.mjs /path/to/your/nextjs-project
```

That's it. The CLI will:

1. Detect your Next.js project structure
2. Scan all `page.tsx` files for editable content (headings, paragraphs, links, images, quotes)
3. Show you what it found
4. Wrap content with `<Editable>` components
5. Generate a content JSON file, API route, and editor UI

### 3. Start your dev server

```bash
cd /path/to/your/nextjs-project
npm run dev
```

### 4. Open the editor

Go to **http://localhost:3000/handoff**

You'll see all your editable content organized by section. Change any field, click **Save & Publish**, and refresh your site to see the update.

---

## What gets created

The CLI adds 4 things to your project:

```
your-project/
├── handoff/
│   └── content.json                  ← Your content data (JSON)
├── src/
│   ├── lib/
│   │   └── handoff/
│   │       └── components.tsx        ← <Editable> and <EditableImage> components
│   └── app/
│       ├── api/
│       │   └── handoff/
│       │       └── route.ts          ← Content API (GET + PUT)
│       └── handoff/
│           └── page.tsx              ← Editor UI
```

**Your existing files:** Only your `page.tsx` files are modified. The CLI wraps hardcoded text with `<Editable>` components and adds an import statement. All original styles, classes, and props are preserved.

---

## What the CLI detects

### Text content

Any hardcoded text inside these HTML elements:

`h1` `h2` `h3` `h4` `h5` `h6` `p` `span` `a` `button` `label` `li` `blockquote` `figcaption` `td` `th` `dt` `dd` `summary`

**Before:**
```jsx
<h1 className="text-4xl font-bold">Build faster with AI</h1>
<p className="text-gray-500">Ship websites in hours, not weeks.</p>
```

**After:**
```jsx
import { Editable } from "@/lib/handoff/components"

<Editable field="section.title_build_faster" tag="h1" className="text-4xl font-bold">
  Build faster with AI
</Editable>
<Editable field="section.description_ship_websites" tag="p" className="text-gray-500">
  Ship websites in hours, not weeks.
</Editable>
```

### Images

`<img>` and Next.js `<Image>` elements with a `src` attribute.

### What it skips

- Text inside `<script>`, `<style>`, `<code>`, `<pre>`, `<svg>` tags
- Single words that look like code: `camelCase`, `snake_case`, URLs, file paths, CSS classes
- Text shorter than 2 characters
- Dynamic content: `{variable}`, `{props.title}`, template literals
- Content from `.map()` calls, ternaries, and other expressions

---

## How the editor works

### Editing content

1. Open `/handoff` on your local dev server
2. Fields are grouped by section (detected from `<section>`, `<header>`, `<footer>` tags and JSX comments)
3. Short text → input field. Long text (80+ chars) → textarea
4. Images → URL input + alt text input + preview
5. Click **Save & Publish** to write changes

### Where content is stored

All content lives in `handoff/content.json` in your project root. This is a plain JSON file — you can edit it directly, commit it to git, or back it up however you like.

```json
{
  "section.title_build_faster": "Build faster with AI",
  "section.description_ship_websites": "Ship websites in hours, not weeks.",
  "footer.copyright": "© 2026 Acme Inc."
}
```

### How updates reach your site

1. Editor saves content → `PUT /api/handoff` writes to `handoff/content.json`
2. API calls `revalidatePath('/')` to invalidate Next.js cache
3. Next request to any page reads the updated JSON file
4. In dev mode: refresh the page to see changes
5. In production (with ISR): pages revalidate automatically

---

## Compatibility

### Works well with

- **Next.js 14/15 App Router** with Server Components (the default)
- **Tailwind CSS** — all classes are preserved on the wrapping element
- **shadcn/ui** — components render as standard HTML elements
- **Inline styles** — preserved as-is
- **Static pages** — content from JSON file is included at build time
- **Vercel / Netlify deployment** — works like any other Next.js data source

### Known limitations

| Limitation | Why | Workaround |
|-----------|-----|------------|
| **Only scans `page.tsx` files** | Content in extracted components (`Hero.tsx`, `Card.tsx`) is not detected | Move content into page files, or manually wrap components with `<Editable>` |
| **Client Components break** | `<Editable>` uses `readFileSync` (Node.js only) | Keep page files as Server Components (the Next.js default). Move interactivity to child client components |
| **Dynamic content is skipped** | Text from variables/props/fetch isn't hardcoded, so there's nothing to wrap | This is correct behavior — only static, hardcoded content should be CMS-managed |
| **No repeatable sections** | Can't add/remove items in lists (feature cards, testimonials) | Edit existing items only, or manually edit `content.json` |
| **Section names are generic** | The scanner guesses section names from HTML structure | Add JSX comments above sections: `{/* Hero Section */}` — the scanner reads these |
| **One page refresh needed** | Editor doesn't auto-refresh the site after saving | Refresh manually, or open the site in a second tab |

### Does NOT work with

- Next.js Pages Router (`pages/` directory)
- Plain React (Vite, Create React App)
- Plain HTML / CSS sites
- Astro, Vue, Svelte, Angular
- Pages that use `'use client'` at the top level

---

## Tips for best results

### 1. Use JSX comments to name your sections

The scanner uses JSX comments to create better section names in the editor.

```jsx
{/* Hero Section */}
<section>
  <h1>Build faster with AI</h1>  {/* → field: hero-section.title_build_faster */}
</section>

{/* Features */}
<section>
  <h2>Why choose us</h2>  {/* → field: features.title_why_choose */}
</section>
```

Without comments, sections are named after their HTML tag (`section`, `header`, `footer`), which is less readable.

### 2. Keep pages as Server Components

Next.js App Router pages are Server Components by default. Don't add `'use client'` to page files. If you need interactivity (click handlers, state), extract it into a child component:

```jsx
// src/app/page.tsx — Server Component (works with Handoff)
import { InteractiveWidget } from '@/components/InteractiveWidget'

export default function Page() {
  return (
    <main>
      <Editable field="hero.title" tag="h1">Build faster</Editable>
      <InteractiveWidget />  {/* Client interactivity lives here */}
    </main>
  )
}
```

### 3. Hardcode your content

Handoff works with hardcoded strings in JSX. If your vibe-coded site fetches content from somewhere else, Handoff won't detect it. The typical vibe-coded site has all content directly in the JSX, which is exactly what Handoff is built for.

```jsx
// ✅ Handoff can detect and wrap this
<h1>Build faster with AI</h1>

// ❌ Handoff skips this (dynamic content)
<h1>{siteConfig.title}</h1>
```

### 4. Commit `handoff/content.json` to git

The content JSON file is your source of truth. Commit it so you have version history and can roll back changes. The editor writes to this file, so content changes show up as diffs in git.

### 5. Add `/handoff` to your production middleware

If you deploy to production, you probably don't want `/handoff` publicly accessible. Add middleware to protect it:

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/handoff') ||
      request.nextUrl.pathname.startsWith('/api/handoff')) {
    // Simple password protection (replace with your own auth)
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${process.env.HANDOFF_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
}

export const config = {
  matcher: ['/handoff/:path*', '/api/handoff/:path*'],
}
```

Or simply remove the `/handoff` and `/api/handoff` routes before deploying if only developers should edit content.

---

## Customizing field names

After running `handoff init`, you can rename fields in `handoff/content.json` for readability. Just make sure the keys in the JSON match the `field` prop in your `<Editable>` components.

**Rename in JSON:**
```json
{
  "hero.title": "Build faster with AI"
}
```

**Update in code to match:**
```jsx
<Editable field="hero.title" tag="h1">Build faster with AI</Editable>
```

---

## Manually adding editable fields

You can manually wrap any text with `<Editable>` — you don't have to use the scanner.

```jsx
import { Editable, EditableImage } from "@/lib/handoff/components"

// Text
<Editable field="pricing.title" tag="h2">Simple pricing</Editable>

// Image
<EditableImage field="hero.image" src="/hero.png" alt="Hero illustration" />
```

Then add the corresponding entry to `handoff/content.json`:

```json
{
  "pricing.title": "Simple pricing",
  "hero.image": { "src": "/hero.png", "alt": "Hero illustration" }
}
```

The editor at `/handoff` will automatically pick up new fields.

---

## Removing Handoff

To undo everything:

1. Delete the generated files:
   ```bash
   rm -rf handoff/
   rm -rf src/lib/handoff/
   rm -rf src/app/handoff/
   rm -rf src/app/api/handoff/
   ```

2. In your `page.tsx` files, replace `<Editable field="..." tag="h1">text</Editable>` back with `<h1>text</h1>`. The text inside the `<Editable>` is your original content.

3. Remove the import line: `import { Editable } from "@/lib/handoff/components"`

---

## Troubleshooting

### "Module not found: Can't resolve '@/lib/handoff/components'"

Your project doesn't have the `@/` path alias configured. Check `tsconfig.json` for:
```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

If your project uses a different alias (e.g., `~/`), update the import in your page files to match.

### "readFileSync is not a function" or "fs is not defined"

Your page file is a Client Component (`'use client'`). The `<Editable>` component only works in Server Components. Remove `'use client'` from the page, or extract interactive parts into a separate client component.

### The editor shows no fields

The scanner didn't find any content. This can happen if:
- All text is dynamic (comes from variables/props)
- Text is inside components the scanner didn't scan (only `page.tsx` files are scanned)
- Text is very short (under 2 characters)

You can always add fields manually — see "Manually adding editable fields" above.

### Changes don't appear after saving

In dev mode, refresh the page. Next.js dev server caches Server Component output. A hard refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`) forces a re-render.

### The codemod produced weird formatting

The Babel code generator doesn't perfectly preserve the original formatting. The code is functionally correct but may have extra blank lines or slightly different whitespace. You can run your formatter (`prettier`, `biome`) after the codemod.
