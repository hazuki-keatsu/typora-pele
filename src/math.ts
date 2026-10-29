import type { MathMarkup } from 'pele'

interface MathJaxHost {
  MathJaxStartupPromise?: Promise<unknown>
  MathJax?: {
    startup?: { promise?: Promise<unknown> }
    tex2svgPromise?: (tex: string, options: { display: boolean }) => Promise<HTMLElement>
  }
}

type CachedMath = { element: SVGSVGElement; width: number; height: number }
let cache = new Map<string, Promise<CachedMath | undefined>>()
const CACHE_LIMIT = 256

export function clearMathCache() {
  cache = new Map()
}

export async function typesetMath(formulas: Set<string>, size: number): Promise<Map<string, MathMarkup>> {
  const result = new Map<string, MathMarkup>()
  const activeCache = cache
  const host = window as unknown as MathJaxHost
  try {
    await host.MathJaxStartupPromise
    await host.MathJax?.startup?.promise
  }
  catch { return result }
  const mathJax = host.MathJax
  if (!mathJax?.tex2svgPromise) return result
  for (const tex of formulas) {
    let pending = activeCache.get(tex)
    if (!pending) {
      pending = Promise.resolve().then(() => mathJax.tex2svgPromise!(tex, { display: false })).then(container => {
        const element = container.querySelector('svg')
        if (!element || element.querySelector('[data-mjx-error]')) return
        // Cache at a unit font size; layout and font-size changes only scale this SVG.
        const markup = standaloneMath(element, 1)
        if (markup) return { element, width: markup.width, height: markup.height }
      }).catch(() => undefined)
    }
    // Share in-flight work and keep recently used formulas without unbounded growth.
    activeCache.delete(tex)
    activeCache.set(tex, pending)
    if (activeCache.size > CACHE_LIMIT) activeCache.delete(activeCache.keys().next().value!)
    const formula = await pending
    if (!formula) {
      if (activeCache.get(tex) === pending) activeCache.delete(tex)
      continue
    }
    const element = formula.element.cloneNode(true) as SVGSVGElement
    const width = formula.width * size
    const height = formula.height * size
    element.setAttribute('width', String(width))
    element.setAttribute('height', String(height))
    result.set(tex, { svg: element.outerHTML, width, height })
  }
  return result
}

export function standaloneMath(svg: SVGSVGElement, size: number): MathMarkup | undefined {
  const pixels = (value: string | null) => {
    const match = value?.match(/^([\d.]+)(ex|em|px)?$/)
    return match ? Number(match[1]) * (match[2] === 'ex' ? size / 2 : match[2] === 'em' ? size : 1) : NaN
  }
  const width = pixels(svg.getAttribute('width'))
  const height = pixels(svg.getAttribute('height'))
  if (!(width > 0 && height > 0 && Number.isFinite(width + height))) return

  // Inline MathJax's local/global glyph references before sanitizing or exporting.
  for (const use of Array.from(svg.querySelectorAll('use'))) {
    const href = use.getAttribute('href') || use.getAttribute('xlink:href')
    if (!href?.startsWith('#')) return
    const glyph = svg.ownerDocument.getElementById(href.slice(1))
      ?? Array.from(svg.querySelectorAll('path')).find(path => path.id === href.slice(1))
    if (glyph?.localName !== 'path') return
    const group = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g')
    const x = parseFloat(use.getAttribute('x') || '0') || 0
    const y = parseFloat(use.getAttribute('y') || '0') || 0
    group.setAttribute('transform', `${use.getAttribute('transform') || ''} translate(${x},${y})`)
    group.appendChild(glyph.cloneNode(true))
    use.replaceWith(group)
  }
  // Formula source may contain links, styles or extension markup; only keep drawing primitives.
  const tags = new Set(['svg', 'g', 'path', 'rect', 'line', 'circle', 'ellipse', 'polygon', 'polyline', 'text', 'tspan'])
  const attributes = /^(?:xmlns|viewBox|width|height|d|transform|fill|stroke|stroke-width|fill-rule|clip-rule|opacity|x|y|x1|x2|y1|y2|cx|cy|r|rx|ry|points|font-size|font-family|text-anchor)$/
  for (const element of [svg, ...Array.from(svg.querySelectorAll('*'))]) {
    if (!tags.has(element.localName)) { element.remove(); continue }
    for (const attribute of Array.from(element.attributes)) {
      if (!attributes.test(attribute.name) || /url\s*\(/i.test(attribute.value)) element.removeAttribute(attribute.name)
    }
  }
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  return { svg: svg.outerHTML, width, height }
}
