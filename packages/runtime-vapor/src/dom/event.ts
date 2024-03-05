import {
  getCurrentEffect,
  getCurrentScope,
  onEffectCleanup,
  onScopeDispose,
} from '@vue/reactivity'
import { MetadataKind, getMetadata, recordEventMetadata } from '../metadata'
import { withKeys, withModifiers } from '@vue/runtime-dom'
import { queuePostRenderEffect } from '../scheduler'

export function addEventListener(
  el: HTMLElement,
  event: string,
  handler: (...args: any) => any,
  options?: AddEventListenerOptions,
) {
  el.addEventListener(event, handler, options)
  return () => el.removeEventListener(event, handler, options)
}

interface ModifierOptions {
  modifiers?: string[]
  keys?: string[]
}

export function on(
  el: HTMLElement,
  event: string,
  handlerGetter: () => undefined | ((...args: any[]) => any),
  options: AddEventListenerOptions & ModifierOptions = {},
) {
  const handler: DelegatedHandler = eventHandler(handlerGetter, options)
  const cleanupMetadata = recordEventMetadata(el, event, handler)

  let cleanupEvent: (() => void) | undefined
  queuePostRenderEffect(() => {
    cleanupEvent = addEventListener(el, event, handler, options)
  })

  const scope = getCurrentScope()
  const effect = getCurrentEffect()
  // If we are in an effect and the effect has the same scope as
  // the current scope, we can cleanup when the effect is disposed
  // This solves the issue where createFor itself has an effect,
  // but this effect is unrelated to its block.
  if (effect && effect.scope === scope) {
    onEffectCleanup(cleanup)
  } else if (scope) {
    onScopeDispose(cleanup)
  }

  function cleanup() {
    cleanupMetadata()
    cleanupEvent && cleanupEvent()
  }
}

export type DelegatedHandler = {
  (...args: any[]): any
  delegate?: boolean
}

export function delegate(
  el: HTMLElement,
  event: string,
  handlerGetter: () => undefined | ((...args: any[]) => any),
  options: ModifierOptions = {},
) {
  const handler: DelegatedHandler = eventHandler(handlerGetter, options)
  handler.delegate = true
  recordEventMetadata(el, event, handler)
}

function eventHandler(
  getter: () => undefined | ((...args: any[]) => any),
  { modifiers, keys }: ModifierOptions = {},
) {
  return (...args: any[]) => {
    let handler = getter()
    if (!handler) return

    if (modifiers) handler = withModifiers(handler, modifiers)
    if (keys) handler = withKeys(handler, keys)
    handler && handler(...args)
  }
}

/**
 * Event delegation borrowed from solid
 */
const delegatedEvents = Object.create(null)

export const delegateEvents = (...names: string[]) => {
  for (const name of names) {
    if (!delegatedEvents[name]) {
      delegatedEvents[name] = true
      // eslint-disable-next-line no-restricted-globals
      document.addEventListener(name, delegatedEventHandler)
    }
  }
}

const delegatedEventHandler = (e: Event) => {
  let node = ((e.composedPath && e.composedPath()[0]) || e.target) as any
  if (e.target !== node) {
    Object.defineProperty(e, 'target', {
      configurable: true,
      value: node,
    })
  }
  Object.defineProperty(e, 'currentTarget', {
    configurable: true,
    get() {
      // eslint-disable-next-line no-restricted-globals
      return node || document
    },
  })
  while (node !== null) {
    const handlers = getMetadata(node)[MetadataKind.event][e.type]
    if (handlers) {
      for (const handler of handlers) {
        if (handler.delegate && !node.disabled) {
          handler(e)
          if (e.cancelBubble) return
        }
      }
    }
    node =
      node.host && node.host !== node && node.host instanceof Node
        ? node.host
        : node.parentNode
  }
}
