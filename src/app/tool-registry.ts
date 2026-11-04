import type { TranslationKey } from '../i18n/en'

export const categories = [
  { id: 'text-data', labelKey: 'category.textData' },
  { id: 'date-time', labelKey: 'category.dateTime' },
  { id: 'image-design', labelKey: 'category.imageDesign' },
] as const satisfies readonly { id: string; labelKey: TranslationKey }[]

export type CategoryId = (typeof categories)[number]['id']

export const tags = {
  formatting: 'tag.formatting',
  encoding: 'tag.encoding',
  decoding: 'tag.decoding',
  'utf-8': 'tag.utf8',
  hash: 'tag.hash',
  checksum: 'tag.checksum',
  query: 'tag.query',
  timestamp: 'tag.timestamp',
  date: 'tag.date',
  color: 'tag.color',
  random: 'tag.random',
  qr: 'tag.qr',
} as const satisfies Record<string, TranslationKey>
export type TagId = keyof typeof tags

export interface ToolDefinition {
  id: string
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  category: CategoryId
  tags: readonly TagId[]
  keywords: readonly string[]
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

async function loadHashGenerator(): Promise<void> {
  await import('../tools/hash-generator')
}

async function loadUrlEncoder(): Promise<void> {
  await import('../tools/url-encoder')
}

async function loadUnixTimestampConverter(): Promise<void> {
  await import('../tools/unix-timestamp-converter')
}

async function loadColorConverter(): Promise<void> {
  await import('../tools/color-converter')
}

async function loadRandomStringGenerator(): Promise<void> {
  await import('../tools/random-string-generator')
}

async function loadDateCalculator(): Promise<void> {
  await import('../tools/date-calculator')
}

export const toolRegistry: readonly ToolDefinition[] = [
  {
    id: 'qr-code',
    category: 'image-design',
    tags: ['qr', 'encoding', 'decoding'],
    keywords: ['qr', 'qr code', '큐알', '코드', 'barcode', '바코드'],
    titleKey: 'tools.qr.title',
    descriptionKey: 'tools.qr.description',
    elementTag: 'qr-code-tool',
    offlineAssetPatterns: ['qr-code-', 'files-', 'clipboard-'],
    load: async () => {
      await import('../tools/qr-code')
    },
  },
  {
    id: 'date-calculator',
    category: 'date-time',
    tags: ['date'],
    keywords: [
      'date calculator',
      'date difference',
      'days',
      '날짜 계산기',
      '날짜 차이',
      '일수',
      '디데이',
    ],
    titleKey: 'tools.dateCalculator.title',
    descriptionKey: 'tools.dateCalculator.description',
    elementTag: 'date-calculator-tool',
    offlineAssetPatterns: ['date-calculator-'],
    load: loadDateCalculator,
  },
  {
    id: 'random-string-generator',
    category: 'text-data',
    tags: ['random'],
    keywords: [
      'random',
      'string',
      'password',
      '랜덤',
      '무작위',
      '문자열',
      '비밀번호',
    ],
    titleKey: 'tools.random.title',
    descriptionKey: 'tools.random.description',
    elementTag: 'random-string-generator-tool',
    offlineAssetPatterns: ['random-string-generator-'],
    load: loadRandomStringGenerator,
  },
  {
    id: 'color-converter',
    category: 'image-design',
    tags: ['color'],
    keywords: ['color', 'colour', '색상', '색깔', '컬러', 'hex', 'rgb', 'hsl'],
    titleKey: 'tools.color.title',
    descriptionKey: 'tools.color.description',
    elementTag: 'color-converter-tool',
    offlineAssetPatterns: ['color-converter-'],
    load: loadColorConverter,
  },
  {
    id: 'unix-timestamp-converter',
    category: 'date-time',
    tags: ['timestamp', 'date'],
    keywords: ['unix', 'epoch', '에포크', '시간', 'time'],
    titleKey: 'tools.timestamp.title',
    descriptionKey: 'tools.timestamp.description',
    elementTag: 'unix-timestamp-converter-tool',
    offlineAssetPatterns: ['unix-timestamp-converter-'],
    load: loadUnixTimestampConverter,
  },
  {
    id: 'json-formatter',
    category: 'text-data',
    tags: ['formatting'],
    keywords: ['json', '제이슨', 'minify', '압축', '정렬'],
    titleKey: 'tools.jsonFormatter.title',
    descriptionKey: 'tools.jsonFormatter.description',
    elementTag: 'json-formatter-tool',
    offlineAssetPatterns: ['json-formatter-'],
    load: loadJsonFormatter,
  },
  {
    id: 'base64',
    category: 'text-data',
    tags: ['encoding', 'decoding', 'utf-8'],
    keywords: ['base64', '베이스64', '변환'],
    titleKey: 'tools.base64.title',
    descriptionKey: 'tools.base64.description',
    elementTag: 'base64-tool',
    offlineAssetPatterns: ['base64-'],
    load: loadBase64,
  },
  {
    id: 'url-encoder',
    category: 'text-data',
    tags: ['encoding', 'decoding', 'query'],
    keywords: ['url', '퍼센트', 'percent', '파라미터', 'parameter'],
    titleKey: 'tools.urlEncoder.title',
    descriptionKey: 'tools.urlEncoder.description',
    elementTag: 'url-encoder-tool',
    offlineAssetPatterns: ['url-encoder-'],
    load: loadUrlEncoder,
  },
  {
    id: 'hash-generator',
    category: 'text-data',
    tags: ['hash', 'checksum', 'utf-8'],
    keywords: ['sha-256', 'sha-384', 'sha-512', '해시 생성'],
    titleKey: 'tools.hashGenerator.title',
    descriptionKey: 'tools.hashGenerator.description',
    elementTag: 'hash-generator-tool',
    offlineAssetPatterns: ['hash-generator-'],
    load: loadHashGenerator,
  },
]
export function getTool(id: string): ToolDefinition | undefined {
  return toolRegistry.find((tool) => tool.id === id)
}
