import type { TranslationKey } from '../i18n/en'

export interface ToolDefinition {
  id: string
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  elementTag: string
  load: () => Promise<void>
}
export const toolRegistry: readonly ToolDefinition[] = [
  {
    id: 'json-formatter',
    titleKey: 'tools.jsonFormatter.title',
    descriptionKey: 'tools.jsonFormatter.description',
    elementTag: 'json-formatter-tool',
    load: async () => {
      await import('../tools/json-formatter')
    },
  },
]
export function getTool(id: string): ToolDefinition | undefined {
  return toolRegistry.find((tool) => tool.id === id)
}
