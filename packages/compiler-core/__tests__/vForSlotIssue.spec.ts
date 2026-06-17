import { describe, expect, test } from 'vitest'
import { baseParse as parse } from '../src/parser'
import { transform } from '../src/transform'
import { transformFor } from '../src/transforms/vFor'
import { transformIf } from '../src/transforms/vIf'
import { transformElement } from '../src/transforms/transformElement'
import { transformSlotOutlet } from '../src/transforms/transformSlotOutlet'
import { trackSlotScopes, trackVForSlotScopes } from '../src/transforms/vSlot'
import { type ElementNode, NodeTypes } from '../src/ast'

function parseTemplate(template: string) {
  const ast = parse(template)
  transform(ast, {
    nodeTransforms: [
      transformIf,
      transformFor,
      trackVForSlotScopes,
      transformSlotOutlet,
      transformElement,
      trackSlotScopes,
    ],
  })
  return ast
}

describe('v-for + v-slot issue', () => {
  test('template v-for without v-slot should create FOR node', () => {
    const ast = parseTemplate(`<Foo><template v-for="i in 3" /></Foo>`)
    const comp = ast.children[0] as ElementNode
    expect(comp.type).toBe(NodeTypes.ELEMENT)
    // The first child should be a FOR node
    expect(comp.children[0].type).toBe(NodeTypes.FOR)
  })

  test('template v-for with v-slot should also create FOR node', () => {
    const ast = parseTemplate(`<Foo><template v-for="i in 3" v-slot /></Foo>`)
    const comp = ast.children[0] as ElementNode
    expect(comp.type).toBe(NodeTypes.ELEMENT)

    // EXPECTED: FOR node containing ELEMENT with slot directive
    // ACTUAL (BUG): ELEMENT node with both for and slot directives
    const firstChild = comp.children[0]

    // This is the expected behavior according to the issue
    expect(firstChild.type).toBe(NodeTypes.FOR)
  })
})
