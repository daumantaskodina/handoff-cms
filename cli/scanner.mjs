/**
 * AST Scanner — finds editable content in Next.js JSX files.
 *
 * Detects:
 * - Text inside content elements (h1-h6, p, span, a, button, li, blockquote, etc.)
 * - Image elements (img, next/image)
 * - Repeatable groups (sibling elements with identical structure)
 */

import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'

// Handle ESM default export quirk
const traverse = _traverse.default || _traverse

// --- Configuration ---

const CONTENT_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'span', 'a', 'button', 'label',
  'li', 'blockquote', 'figcaption', 'td', 'th',
  'dt', 'dd', 'summary',
])

const SKIP_TAGS = new Set([
  'script', 'style', 'code', 'pre', 'noscript', 'svg', 'path',
  'meta', 'link', 'head',
])

const CONTENT_ATTRIBUTES = new Set(['alt', 'title', 'placeholder', 'aria-label'])

// --- Helpers ---

function isCodePattern(text) {
  if (!text || text.length < 2) return true
  // camelCase or PascalCase identifiers
  if (/^[a-z][a-zA-Z0-9]+$/.test(text) && !text.includes(' ')) return true
  // snake_case
  if (/^[a-z_]+$/.test(text) && text.includes('_')) return true
  // URLs
  if (/^https?:\/\//.test(text)) return true
  // file paths
  if (/^[./][\w./-]+$/.test(text)) return true
  // CSS classes
  if (/^[.#]?[a-z][\w-]*$/.test(text) && !text.includes(' ')) return true
  // Single character
  if (text.length <= 1) return true
  // Looks like a variable name (no spaces, starts lowercase)
  if (/^[a-z][\w]*$/.test(text)) return true
  // HTML entities only
  if (/^&[\w#]+;$/.test(text)) return true
  return false
}

function getJSXElementTag(path) {
  // Walk up to find the enclosing JSXElement
  let current = path
  while (current) {
    if (current.isJSXElement()) {
      const opening = current.node.openingElement
      if (opening.name.type === 'JSXIdentifier') {
        return opening.name.name
      }
      if (opening.name.type === 'JSXMemberExpression') {
        return `${opening.name.object.name}.${opening.name.property.name}`
      }
    }
    current = current.parentPath
  }
  return null
}

function findEnclosingSection(path) {
  // Walk up looking for a <section> or a div/section with a comment above it
  let current = path.parentPath
  while (current) {
    if (current.isJSXElement()) {
      const tag = current.node.openingElement.name.name
      if (tag === 'section' || tag === 'header' || tag === 'footer' || tag === 'nav') {
        // Try to get a section name from id, className, or nearby comment
        const attrs = current.node.openingElement.attributes
        for (const attr of attrs) {
          if (attr.type === 'JSXAttribute' && attr.name?.name === 'id' && attr.value?.value) {
            return attr.value.value
          }
        }
        // Check for a JSX comment above
        const parent = current.parentPath
        if (parent?.isJSXElement()) {
          const siblings = parent.node.children
          const idx = siblings.indexOf(current.node)
          if (idx > 0) {
            const prev = siblings[idx - 1]
            if (prev.type === 'JSXExpressionContainer' &&
                prev.expression.type === 'JSXEmptyExpression' &&
                prev.expression.innerComments?.length) {
              const comment = prev.expression.innerComments[0].value.trim()
              return slugify(comment)
            }
          }
        }
        return tag
      }
    }
    current = current.parentPath
  }
  return 'main'
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
}

function makeFieldName(tag, text, existingFields) {
  // Generate a readable field name from the tag and text
  let base = ''
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
    base = 'title'
  } else if (tag === 'p') {
    base = 'description'
  } else if (tag === 'a' || tag === 'button') {
    base = 'cta'
  } else if (tag === 'blockquote') {
    base = 'quote'
  } else if (tag === 'img' || tag === 'Image') {
    base = 'image'
  } else {
    base = 'text'
  }

  // Add a suffix from the content for uniqueness
  const words = text.split(/\s+/).slice(0, 3).map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
  const suffix = words.filter(Boolean).join('_')
  const candidate = suffix ? `${base}_${suffix}` : base

  // Deduplicate
  let name = candidate
  let counter = 2
  while (existingFields.has(name)) {
    name = `${candidate}_${counter}`
    counter++
  }
  existingFields.add(name)
  return name
}

// --- Main Scanner ---

export function scanFile(code, filePath) {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: true,
  })

  const fields = []
  const existingFieldNames = new Set()

  traverse(ast, {
    JSXText(path) {
      const text = path.node.value.trim().replace(/\s+/g, ' ')
      if (!text || text.length < 2) return
      if (isCodePattern(text)) return

      const tag = getJSXElementTag(path)
      if (!tag) return
      const tagLower = tag.toLowerCase()
      if (SKIP_TAGS.has(tagLower)) return

      // Only wrap text inside known content tags OR any tag if text is substantial
      const isContentTag = CONTENT_TAGS.has(tagLower)
      const isSubstantial = text.split(' ').length >= 2
      if (!isContentTag && !isSubstantial) return

      const section = findEnclosingSection(path)
      const fieldName = makeFieldName(tagLower, text, existingFieldNames)

      fields.push({
        type: 'text',
        tag: tagLower,
        field: fieldName,
        section,
        value: text,
        line: path.node.loc?.start.line,
        filePath,
      })
    },

    JSXElement(path) {
      const opening = path.node.openingElement
      if (!opening.name || opening.name.type !== 'JSXIdentifier') return
      const tag = opening.name.name

      // Detect img / Image elements
      if (tag === 'img' || tag === 'Image') {
        let src = null
        let alt = null
        for (const attr of opening.attributes) {
          if (attr.type !== 'JSXAttribute') continue
          const name = attr.name?.name
          if (name === 'src' && attr.value) {
            if (attr.value.type === 'StringLiteral') src = attr.value.value
            else if (attr.value.type === 'JSXExpressionContainer' &&
                     attr.value.expression.type === 'StringLiteral') {
              src = attr.value.expression.value
            }
          }
          if (name === 'alt' && attr.value) {
            if (attr.value.type === 'StringLiteral') alt = attr.value.value
          }
        }

        if (src) {
          const section = findEnclosingSection(path)
          const fieldName = makeFieldName('img', alt || src, existingFieldNames)
          fields.push({
            type: 'image',
            tag,
            field: fieldName,
            section,
            value: src,
            alt: alt || '',
            line: opening.loc?.start.line,
            filePath,
          })
        }
      }
    },
  })

  return fields
}

// --- Repeatable Group Detection ---

export function detectRepeatableGroups(code, filePath) {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: true,
  })

  const groups = []

  function getSignature(node) {
    if (node.type !== 'JSXElement') return null
    const tag = node.openingElement.name?.name || '?'
    const childSigs = (node.children || [])
      .filter(c => c.type === 'JSXElement')
      .map(c => getSignature(c))
      .filter(Boolean)
    return childSigs.length ? `${tag}>${childSigs.join('+')}` : tag
  }

  traverse(ast, {
    JSXElement(path) {
      const children = path.node.children.filter(c => c.type === 'JSXElement')
      if (children.length < 2) return

      const sigs = children.map(c => getSignature(c))
      const allMatch = sigs.every(s => s === sigs[0]) && sigs[0] !== null

      if (allMatch) {
        const section = findEnclosingSection(path)
        groups.push({
          section,
          count: children.length,
          signature: sigs[0],
          line: path.node.loc?.start.line,
          filePath,
        })
      }
    },
  })

  return groups
}
