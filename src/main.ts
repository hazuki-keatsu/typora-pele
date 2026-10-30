import {
	type HtmlExportProcessor,
	I18n,
	path,
	Plugin,
	PluginSettings,
} from "@typora-community-plugin/core";
import type * as en from "./locales/lang.en.json";
import { editor } from "typora";
import {
	installRenderer,
	installRealtimeRendering,
	watchDiagramWidth,
} from "./renderer";
import { renderMermaid } from "./render";
import { clearMathCache } from "./math";
import { type PeleSettings, PeleSettingTab } from "./settings";
import { applyCss, isDarkBackground, themeCss } from "./styles";

export default class extends Plugin<PeleSettings> {
	onload() {
		const i18n = new I18n<typeof en>({
			localePath: path.join(this.manifest.dir ?? "/src/", "locales"),
			userLang: this.app.i18n.locale,
			defaultLang: "en",
		});
		const settings = new PluginSettings<PeleSettings>(this.app, this.manifest, {
			version: 1,
		});
		settings.setDefault({
			realtimeRendering: true,
			lightVariables: "",
			darkVariables: "",
		});
		this.registerSettings(settings);
		this.registerSettingTab(new PeleSettingTab(settings, i18n));

		const updateTheme = () =>
			applyCss(
				document,
				themeCss(
					settings.get("lightVariables"),
					settings.get("darkVariables"),
					isDarkBackground(getComputedStyle(document.body).backgroundColor),
				),
			);
		const style = updateTheme();
		this.register(() => style.remove());
		this.register(settings.onChange("*", updateTheme));
		this.registerDomEvent(
			document,
			"load",
			(event) => {
				if (event.target instanceof HTMLLinkElement) updateTheme();
			},
			true,
		);
		const exportProcessor: HtmlExportProcessor = {
			type: "html",
			process({ doc }) {
				if (doc.querySelector("svg.pele"))
					applyCss(doc, style.textContent || "");
			},
		};
		this.register(this.app.features.exporter.register(exportProcessor));

		// shortcut: refreshDiagram is private; check it when upgrading Typora.
		const diagrams = editor.diagrams as typeof editor.diagrams & {
			refreshDiagram?: (force: boolean) => void;
		};
		const refresh = () => diagrams.refreshDiagram?.(true);
		const restore = installRenderer(
			window,
			renderMermaid,
			i18n.t.unsupportedRenderer,
		);
		const restoreTiming = installRealtimeRendering(
			editor.diagrams,
			(cid) =>
				editor.getNode(cid)?.get("lang")?.toLowerCase().trim() === "mermaid",
			() => settings.get("realtimeRendering"),
		);
		this.register(() => {
			clearMathCache();
			restoreTiming();
			restore();
			refresh();
		});
		refresh();
		const writingArea = document.querySelector<HTMLElement>("#write");
		if (writingArea) this.register(watchDiagramWidth(writingArea, refresh));
	}
}
