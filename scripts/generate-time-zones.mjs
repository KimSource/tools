// Usage: node scripts/generate-time-zones.mjs <directory containing CLDR JSON files>
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { format } from 'prettier'
import process from 'node:process'
const dir = process.argv[2]
if (!dir)
  throw new Error('Provide the directory containing the CLDR source files')
const read = (name) => JSON.parse(readFileSync(join(dir, name), 'utf8'))
const zoneNames = Object.fromEntries(
  ['ko', 'en'].map((locale) => [
    locale,
    read(`tools-cldr-${locale}.json`).main[locale].dates.timeZoneNames.zone,
  ]),
)
const territories = Object.fromEntries(
  ['ko', 'en'].map((locale) => [
    locale,
    read(`tools-territories-${locale}.json`).main[locale].localeDisplayNames
      .territories,
  ]),
)
const zones = read('tools-cldr-zones.json').keyword.u.tz
const names = (root, id) =>
  id.split('/').reduce((v, key) => v?.[key], root)?.exemplarCity
const rows = []
for (const [short, entry] of Object.entries(zones)) {
  if (typeof entry !== 'object' || !entry._alias || entry._deprecated) continue
  const aliases = entry._alias.split(' ').filter((id) => id.includes('/'))
  const id = entry._iana || aliases[0]
  if (!id || id.startsWith('Etc/')) continue
  const region = entry._region || short.slice(0, 2).toUpperCase()
  const countryKo = territories.ko[region] || ''
  const countryEn = territories.en[region] || ''
  const fallback = id.split('/').at(-1).replaceAll('_', ' ')
  const city = (locale) =>
    aliases.map((alias) => names(zoneNames[locale], alias)).find(Boolean) ||
    fallback
  rows.push({
    id,
    aliases,
    ko: city('ko'),
    en: city('en'),
    countryKo,
    countryEn,
  })
}
rows.sort((a, b) => a.id.localeCompare(b.id, 'en'))
writeFileSync(
  'src/tools/time-zone-converter/time-zones.json',
  await format(JSON.stringify(rows), { parser: 'json' }),
)
console.log(`Generated ${rows.length} time zones`)
