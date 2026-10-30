import {
	type I18n,
	type PluginSettings,
	SettingTab,
} from "@typora-community-plugin/core";
import type * as en from "./locales/lang.en.json";

export interface PeleSettings {
	realtimeRendering: boolean;
	lightVariables: string;
	darkVariables: string;
}

export class PeleSettingTab extends SettingTab {
	get name() {
		return "Pele";
	}

	constructor(
		private settings: PluginSettings<PeleSettings>,
		private i18n: I18n<typeof en>,
	) {
		super();
	}

	onshow() {
		this.containerEl.replaceChildren();
		const t = this.i18n.t;
		this.addSetting((setting) => {
			setting.addName(t.realtimeRendering);
			setting.addDescription(t.realtimeRenderingDescription);
			setting.addCheckbox({
				settings: this.settings,
				bindingKey: "realtimeRendering",
			});
		});
		for (const [key, name] of [
			["lightVariables", t.lightVariables],
			["darkVariables", t.darkVariables],
		] as const) {
			this.addSetting((setting) => {
				setting.addName(name);
				setting.addDescription(t.variablesDescription);
				setting.containerEl.style.flexDirection = "column";
				setting.containerEl.style.alignItems = "stretch";
				setting.addTextArea((input) => {
					input.setAttribute("aria-label", name);
					input.rows = 8;
					input.spellcheck = false;
					input.style.width = "100%";
					input.style.fontFamily = "monospace";
					input.placeholder = "--pele-accent: #5b7bd5;\n--pele-radius: 6px;";
					input.value = this.settings.get(key);
					input.oninput = () => this.settings.set(key, input.value);
				});
			});
		}
	}
}
