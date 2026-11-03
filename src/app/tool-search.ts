import { en } from '../i18n/en'
import { ko } from '../i18n/ko'
import { tags, type CategoryId, type ToolDefinition } from './tool-registry'

const normalize = (value: string) =>
  value.normalize('NFKC').toLowerCase().trim()

export function filterTools(
  tools: readonly ToolDefinition[],
  query: string,
  category: CategoryId | 'all',
): ToolDefinition[] {
  const terms = normalize(query).split(/\s+/u).filter(Boolean)
  return tools.filter((tool) => {
    if (category !== 'all' && tool.category !== category) return false
    const keys = [
      tool.titleKey,
      tool.descriptionKey,
      ...tool.tags.map((tag) => tags[tag]),
    ]
    const fields = [
      tool.id,
      ...tool.keywords,
      ...keys.flatMap((key) => [ko[key], en[key]]),
    ].map(normalize)
    return terms.every((term) => fields.some((field) => field.includes(term)))
  })
}
