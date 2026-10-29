import { PluginSettings, SettingTab } from '@typora-community-plugin/core'

export interface PeleSettings {
  realtimeRendering: boolean
  lightVariables: string
  darkVariables: string
}

export class PeleSettingTab extends SettingTab {
  get name() { return 'Pele' }

  constructor(private settings: PluginSettings<PeleSettings>) {
    super()
  }

  onshow() {
    this.containerEl.replaceChildren()
    this.addSetting(setting => {
      setting.addName('实时渲染')
      setting.addDescription('立即更新编辑和布局变化。关闭后使用 Typora 原有的延迟渲染，适合图表较多或较复杂的文档。')
      setting.addCheckbox({ settings: this.settings, bindingKey: 'realtimeRendering' })
    })
    for (const [key, name] of [
      ['lightVariables', '亮色主题变量'],
      ['darkVariables', '暗色主题变量'],
    ] as const) {
      this.addSetting(setting => {
        setting.addName(name)
        setting.addDescription('每行填写 --pele-* 变量声明，无需 .pele 选择器。自动保存并生效；留空使用默认配色。')
        setting.containerEl.style.flexDirection = 'column'
        setting.containerEl.style.alignItems = 'stretch'
        setting.addTextArea(input => {
          input.setAttribute('aria-label', name)
          input.rows = 8
          input.spellcheck = false
          input.style.width = '100%'
          input.style.fontFamily = 'monospace'
          input.placeholder = '--pele-accent: #5b7bd5;\n--pele-radius: 6px;'
          input.value = this.settings.get(key)
          input.oninput = () => this.settings.set(key, input.value)
        })
      })
    }
  }
}
