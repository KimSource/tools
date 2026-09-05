import type { TranslationKey } from '../i18n/en'

export interface ToolDefinition {
  id: string
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  elementTag: string
  offlineSupport: 'precache' | 'online-only'
  load: () => Promise<void>
}

async function loadJsonFormatter(): Promise<void> {
  const params = new URLSearchParams(window.location.search)
  const delay = Number(params.get('e2e-load-delay'))
  if (Number.isFinite(delay) && delay > 0)
    await new Promise((resolve) => window.setTimeout(resolve, delay))
  if (params.get('e2e-load-fail') === '1') {
    params.delete('e2e-load-fail')
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?${params}${window.location.hash}`,
    )
    throw new Error('E2E loader failure')
  }
  await import('../tools/json-formatter')
}

export const toolRegistry: readonly ToolDefinition[] = [
  {
    id: 'json-formatter',
    titleKey: 'tools.jsonFormatter.title',
    descriptionKey: 'tools.jsonFormatter.description',
    elementTag: 'json-formatter-tool',
    offlineSupport: 'precache',
    load: loadJsonFormatter,
  },
]
export function getTool(id: string): ToolDefinition | undefined {
  return toolRegistry.find((tool) => tool.id === id)
}
