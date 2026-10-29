import type { Diagram } from 'typora'

export type Render = (id: string, source: string, container?: HTMLElement) => Promise<{ svg: string }>

interface MermaidAPI {
  render: Render
}

export function installRenderer(host: object, render: Render, unsupportedMessage: string) {
  const target = host as { mermaidAPI?: MermaidAPI }
  const descriptor = Object.getOwnPropertyDescriptor(target, 'mermaidAPI')
  if (descriptor && (!descriptor.configurable || descriptor.get || descriptor.set || !descriptor.writable)) {
    throw new Error(unsupportedMessage)
  }

  let native = target.mermaidAPI
  let replacement = native && { ...native, render }
  const get = () => replacement

  // Typora assigns mermaidAPI again after lazily loading Mermaid.
  Object.defineProperty(target, 'mermaidAPI', {
    configurable: true,
    enumerable: descriptor?.enumerable ?? true,
    get,
    set(api: MermaidAPI | undefined) {
      native = api
      replacement = api && { ...api, render }
    },
  })

  return () => {
    if (Object.getOwnPropertyDescriptor(target, 'mermaidAPI')?.get !== get) return
    if (descriptor) Object.defineProperty(target, 'mermaidAPI', { ...descriptor, value: native })
    else {
      delete target.mermaidAPI
      if (native) target.mermaidAPI = native
    }
  }
}

export function installRealtimeRendering(
  diagrams: Pick<Diagram, 'updateDiagram'>,
  isMermaid: (cid: string) => boolean,
  isEnabled: () => boolean,
) {
  const original = diagrams.updateDiagram
  const replacement: typeof original = function (cid, ...args) {
    // Typora's third argument skips its 200 ms rendering delay.
    if (isEnabled() && isMermaid(cid)) args[1] = true
    return original.call(this, cid, ...args)
  }
  diagrams.updateDiagram = replacement
  return () => {
    if (diagrams.updateDiagram === replacement) diagrams.updateDiagram = original
  }
}

export function watchDiagramWidth(element: HTMLElement, refresh: () => void) {
  let width = element.clientWidth
  const observer = new ResizeObserver(([entry]) => {
    const nextWidth = entry.contentRect.width
    if (nextWidth <= 0 || nextWidth === width) return
    width = nextWidth
    refresh()
  })
  observer.observe(element)
  return () => observer.disconnect()
}
