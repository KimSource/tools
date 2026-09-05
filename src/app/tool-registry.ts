import type { TranslationKey } from '../i18n/en'

export interface ToolDefinition {
  id: string
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  elementTag: string
  offlineAssetPatterns: readonly string[]
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

async function loadBase64(): Promise<void> {
  await import('../tools/base64')
}

export const toolRegistry: readonly ToolDefinition[] = [
  {
    id: 'json-formatter',
    titleKey: 'tools.jsonFormatter.title',
    descriptionKey: 'tools.jsonFormatter.description',
    elementTag: 'json-formatter-tool',
    offlineAssetPatterns: ['json-formatter-'],
    load: loadJsonFormatter,
  },
  {
    id: 'base64',
    titleKey: 'tools.base64.title',
    descriptionKey: 'tools.base64.description',
    elementTag: 'base64-tool',
    offlineAssetPatterns: ['base64-'],
    load: loadBase64,
  },
]
export function getTool(id: string): ToolDefinition | undefined {
  return toolRegistry.find((tool) => tool.id === id)
}
