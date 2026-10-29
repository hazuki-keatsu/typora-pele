import { PeleError, render } from 'pele'
import { typesetMath } from './math'

export async function renderMermaid(id: string, source: string, container?: HTMLElement) {
  const element = container ?? document.querySelector<HTMLElement>('#write') ?? document.body
  const style = getComputedStyle(element)
  try {
    const options = {
      idPrefix: id.replace(/[^a-zA-Z0-9_-]/g, '_'),
      fontFamily: style.fontFamily,
      fontSize: parseFloat(style.fontSize) || 16,
      maxWidth: element.clientWidth || undefined,
    }
    const formulas = new Set<string>()
    const result = render(source, { ...options, math: tex => { formulas.add(tex); return null } })
    if (!formulas.size) return result
    const math = await typesetMath(formulas, options.fontSize)
    return render(source, { ...options, math: tex => math.get(tex) })
  }
  catch (error) {
    if (error instanceof PeleError && error.line > 0) {
      Object.assign(error, { loc: {
        first_line: error.line,
        last_line: error.line,
        first_column: Math.max(0, error.column - 1),
        last_column: error.column,
      } })
    }
    throw error
  }
}
