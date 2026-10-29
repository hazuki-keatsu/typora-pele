import { PeleError, render } from 'pele'

export async function renderMermaid(id: string, source: string, container?: HTMLElement) {
  const element = container ?? document.querySelector<HTMLElement>('#write') ?? document.body
  const style = getComputedStyle(element)
  try {
    return render(source, {
      idPrefix: id.replace(/[^a-zA-Z0-9_-]/g, '_'),
      fontFamily: style.fontFamily,
      fontSize: parseFloat(style.fontSize) || 16,
      maxWidth: element.clientWidth || undefined,
    })
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
