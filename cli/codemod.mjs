/**
 * Codemod — wraps detected content with <Editable> components.
 *
 * Transforms:
 *   <h1>Build faster</h1>
 * Into:
 *   <Editable field="hero.title" tag="h1">Build faster</Editable>
 *
 * Also injects the import statement and generates the content JSON.
 */

import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
import _generate from '@babel/generator'
import * as t from '@babel/types'

const traverse = _traverse.default || _traverse
const generate = _generate.default || _generate

/**
 * Apply the codemod to a source file given detected fields.
 * Returns the transformed source code.
 */
export function applyCodemod(code, fields) {
  if (!fields.length) return code

  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: true,
  })

  const needsImport = { Editable: false, EditableImage: false }

  // Build a lookup: line number → field info
  const fieldByLine = new Map()
  for (const f of fields) {
    fieldByLine.set(f.line, f)
  }

  // Track which nodes we've already processed (by line)
  const processed = new Set()

  traverse(ast, {
    // Handle text content: wrap the parent JSX element
    JSXText(path) {
      const text = path.node.value.trim().replace(/\s+/g, ' ')
      if (!text) return

      const line = path.node.loc?.start.line
      const field = fieldByLine.get(line)
      if (!field || field.type !== 'text') return
      if (processed.has(line)) return

      // Find the parent JSXElement (the one we want to wrap)
      const parentElement = path.findParent(p => p.isJSXElement())
      if (!parentElement) return

      // Check if already wrapped
      const parentTag = parentElement.node.openingElement.name
      if (parentTag.type === 'JSXIdentifier' && parentTag.name === 'Editable') return

      processed.add(line)
      needsImport.Editable = true

      const fieldKey = `${field.section}.${field.field}`

      // Create: <Editable field="section.field" tag="h1">...children...</Editable>
      const editableElement = t.jsxElement(
        t.jsxOpeningElement(
          t.jsxIdentifier('Editable'),
          [
            t.jsxAttribute(t.jsxIdentifier('field'), t.stringLiteral(fieldKey)),
            t.jsxAttribute(t.jsxIdentifier('tag'), t.stringLiteral(field.tag)),
          ]
        ),
        t.jsxClosingElement(t.jsxIdentifier('Editable')),
        parentElement.node.children
      )

      // Replace the original element entirely
      // But we want to KEEP the original tag's styles/props.
      // So instead, we'll wrap the text content only, keeping the outer element.

      // Strategy: replace the JSXText with an Editable that renders text
      // The outer element (h1, p, etc.) stays as-is for styling.
      // <h1><Editable field="x" tag="span">text</Editable></h1>
      //
      // Actually simpler: replace the entire parent element with Editable
      // and pass the original tag + props through.

      // Let's keep it simple for PoC:
      // Replace the text content inside the element with:
      // <Editable field="x" tag="span">original text</Editable>
      // This preserves the outer element's styling.

      // Even simpler for PoC: just wrap the entire parent element.
      // The Editable component will render the correct tag.

      // Get all non-JSX attributes from the parent (style, className, etc.)
      const originalAttrs = parentElement.node.openingElement.attributes

      // Build new element:
      // <Editable field="section.field" tag="h1" style={...} className="...">text</Editable>
      const editableAttrs = [
        t.jsxAttribute(t.jsxIdentifier('field'), t.stringLiteral(fieldKey)),
        t.jsxAttribute(t.jsxIdentifier('tag'), t.stringLiteral(field.tag)),
        ...originalAttrs,
      ]

      const newElement = t.jsxElement(
        t.jsxOpeningElement(t.jsxIdentifier('Editable'), editableAttrs),
        t.jsxClosingElement(t.jsxIdentifier('Editable')),
        [t.jsxText(field.value)]
      )

      parentElement.replaceWith(newElement)
    },

    // Handle images
    JSXElement(path) {
      const opening = path.node.openingElement
      if (!opening.name || opening.name.type !== 'JSXIdentifier') return
      const tag = opening.name.name
      if (tag !== 'img' && tag !== 'Image') return

      const line = opening.loc?.start.line
      const field = fieldByLine.get(line)
      if (!field || field.type !== 'image') return
      if (processed.has(line)) return

      // Check if already wrapped
      const parent = path.findParent(p => p.isJSXElement())
      if (parent?.node.openingElement.name.name === 'EditableImage') return

      processed.add(line)
      needsImport.EditableImage = true

      const fieldKey = `${field.section}.${field.field}`

      // Keep all original attributes, add field prop
      const newAttrs = [
        t.jsxAttribute(t.jsxIdentifier('field'), t.stringLiteral(fieldKey)),
        ...opening.attributes,
      ]

      const newElement = t.jsxElement(
        t.jsxOpeningElement(t.jsxIdentifier('EditableImage'), newAttrs, true),
        null,
        [],
      )

      path.replaceWith(newElement)
    },
  })

  // Add import statement at the top
  const components = Object.entries(needsImport)
    .filter(([, needed]) => needed)
    .map(([name]) => name)

  if (components.length > 0) {
    const importDecl = t.importDeclaration(
      components.map(c => t.importSpecifier(t.identifier(c), t.identifier(c))),
      t.stringLiteral('@/lib/handoff/components')
    )

    // Insert after the last existing import
    let lastImportIdx = -1
    for (let i = 0; i < ast.program.body.length; i++) {
      if (ast.program.body[i].type === 'ImportDeclaration') {
        lastImportIdx = i
      }
    }
    ast.program.body.splice(lastImportIdx + 1, 0, importDecl)
  }

  const output = generate(ast, {
    retainLines: true,
    retainFunctionParens: true,
  }, code)

  return output.code
}

/**
 * Generate the initial content JSON from detected fields.
 */
export function generateContentJson(fields) {
  const content = {}

  for (const field of fields) {
    const key = `${field.section}.${field.field}`
    if (field.type === 'text') {
      content[key] = field.value
    } else if (field.type === 'image') {
      content[key] = { src: field.value, alt: field.alt || '' }
    }
  }

  return content
}
