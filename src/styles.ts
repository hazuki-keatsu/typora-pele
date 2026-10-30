// Dark palette from Pele's official theming example; light uses Pele's built-in defaults.
export const DARK_VARIABLES = `  --pele-bg: #100f0f;
  --pele-fg: #cecdc3;
  --pele-muted: #878580;
  --pele-line: #cecdc3;
  --pele-surface: #1c1b1a;
  --pele-surface-alt: #282726;
  --pele-border: #403e3c;
  --pele-accent: #4385be;
  --pele-critical: #d14d41;`;

export function themeCss(
	lightVariables: string,
	darkVariables: string,
	dark = false,
) {
	return `.pele {
  background: var(--pele-bg, #ffffff);
  box-sizing: border-box;
  border: 1px solid var(--pele-border, #d1d9e0);
  border-radius: 6px;
  padding: 16px;
${dark ? DARK_VARIABLES : ""}
${dark ? darkVariables : lightVariables}
}`;
}

export function isDarkBackground(color: string) {
	const rgb = color.match(/[\d.]+/g)?.map(Number);
	if (!rgb || rgb.length < 3 || rgb[3] === 0) return false;
	return (299 * rgb[0] + 587 * rgb[1] + 114 * rgb[2]) / 1000 < 128;
}

export function applyCss(doc: Document, css: string) {
	let style = doc.getElementById("typora-pele-style");
	if (!style) {
		style = doc.createElement("style");
		style.id = "typora-pele-style";
		doc.head.appendChild(style);
	}
	style.textContent = css;
	return style;
}
