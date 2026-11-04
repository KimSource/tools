import { LitElement, css, html, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { DateTime } from 'luxon'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { getLocale, subscribeToLocale, t } from '../../i18n/i18n'
import { copyText } from '../../services/clipboard'
import {
  annualOffsets,
  convertTime,
  resolveBaseTime,
} from './time-zone-converter.core'
import data from './time-zones.json'

type Zone = (typeof data)[number]
const utc: Zone = {
  id: 'UTC',
  aliases: ['UTC', 'Etc/UTC'],
  ko: 'UTC',
  en: 'UTC',
  countryKo: '',
  countryEn: '',
}
const valid = (id: string) => DateTime.now().setZone(id).isValid
const zones = [utc, ...data.filter((zone) => valid(zone.id))]
const offsetText = (offset: number) => {
  const seconds = Math.round(Math.abs(offset) * 60)
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const s = seconds % 60
  return `UTC${offset < 0 ? '−' : '+'}${h}:${m}${s ? `:${String(s).padStart(2, '0')}` : ''}`
}

@customElement('time-zone-converter-tool')
export class TimeZoneConverter extends LitElement {
  @state() private value = DateTime.local().toFormat("yyyy-MM-dd'T'HH:mm")
  @state() private base = 'UTC'
  @state() private selected = 'UTC'
  @state() private targets: string[] = ['UTC']
  @state() private baseSearch = ''
  @state() private targetSearch = ''
  @state() private error: 'invalid' | 'gap' | 'none' | '' = ''
  @state() private possibilities: DateTime[] = []
  @state() private choice = ''
  @state() private results: { id: string; text: string }[] = []
  @state() private notice: 'copied' | 'failed' | '' = ''
  @state() private offsets: Record<string, number[]> = {}
  @state() private loading = false
  private generation = 0
  private unsubscribe?: () => void
  private local = Intl.DateTimeFormat().resolvedOptions().timeZone
  connectedCallback() {
    super.connectedCallback()
    const local = zones.find(
      (zone) => zone.id === this.local || zone.aliases.includes(this.local),
    )
    if (local) this.base = local.id
    this.unsubscribe = subscribeToLocale(() => this.requestUpdate())
    this.scheduleOffsets()
  }
  disconnectedCallback() {
    this.generation++
    this.unsubscribe?.()
    super.disconnectedCallback()
  }
  private scheduleOffsets() {
    const generation = ++this.generation
    const year = Number(this.value.slice(0, 4))
    this.offsets = {}
    this.loading = true
    if (!year || year > 9999) {
      this.loading = false
      return
    }
    let index = 0
    const next = () => {
      if (generation !== this.generation || !this.isConnected) return
      const batch = zones.slice(index, index + 5)
      for (const zone of batch)
        this.offsets[zone.id] = annualOffsets(zone.id, year)
      index += batch.length
      if (index < zones.length) window.setTimeout(next, 0)
      else this.loading = false
    }
    window.setTimeout(next, 0)
  }
  private clear() {
    this.results = []
    this.error = ''
    this.possibilities = []
    this.choice = ''
    this.notice = ''
  }
  private label(zone: Zone) {
    const locale = getLocale()
    const name = locale === 'ko' ? zone.ko : zone.en
    const country = locale === 'ko' ? zone.countryKo : zone.countryEn
    const offsets = this.offsets[zone.id]?.map(offsetText).join(' / ')
    return `${zone.id === this.base && zone.aliases.includes(this.local) ? `${t('tz.local')} · ` : ''}${name}${country ? ` · ${country}` : ''}${offsets ? ` (${offsets})` : ''} — ${zone.id}`
  }
  private filtered(query: string) {
    const locale = getLocale()
    const normalized = query.toLocaleLowerCase().replaceAll('−', '-')
    return zones
      .filter((z) =>
        [
          z.id,
          ...z.aliases,
          z.ko,
          z.en,
          z.countryKo,
          z.countryEn,
          ...(this.offsets[z.id] ?? []).map(offsetText),
        ]
          .join(' ')
          .toLocaleLowerCase()
          .replaceAll('−', '-')
          .includes(normalized),
      )
      .sort((a, b) => {
        const rank = (z: Zone) =>
          z.aliases.includes(this.local) ? 0 : z.id === 'UTC' ? 1 : 2
        return (
          rank(a) - rank(b) ||
          a[locale].localeCompare(b[locale], locale) ||
          a.id.localeCompare(b.id)
        )
      })
  }
  private select(search: string, selected: string, kind: 'base' | 'target') {
    const list = this.filtered(search)
    const choose = (v: string) => {
      if (!v) return
      if (kind === 'base') {
        this.base = v
        this.clear()
      } else this.selected = v
    }
    return html`<label
        >${t(kind === 'base' ? 'tz.baseSearch' : 'tz.targetSearch')}<input
          type="search"
          .value=${search}
          @input=${(e: Event) => {
            const v = (e.target as HTMLInputElement).value
            if (kind === 'base') this.baseSearch = v
            else this.targetSearch = v
          }}
      /></label>
      <label
        >${t(kind === 'base' ? 'tz.base' : 'tz.target')}<select
          @change=${(e: Event) => choose((e.target as HTMLSelectElement).value)}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
            const index = list.findIndex((zone) => zone.id === selected)
            const next =
              index < 0
                ? 0
                : Math.max(
                    0,
                    Math.min(
                      list.length - 1,
                      index + (e.key === 'ArrowDown' ? 1 : -1),
                    ),
                  )
            const zone = list[next]
            if (zone) {
              e.preventDefault()
              choose(zone.id)
            }
          }}
        >
          ${!list.some((z) => z.id === selected) ? html`<option value="" selected>${t(list.length ? 'tz.choose' : 'tz.noResults')}</option>` : nothing}
          ${list.map((z) => html`<option value=${z.id} ?selected=${z.id === selected}>${this.label(z)}</option>`)}
        </select></label
      >`
  }
  private calculate() {
    this.results = []
    this.notice = ''
    this.error = ''
    if (!this.targets.length) {
      this.error = 'none'
      return
    }
    if (!this.filtered(this.baseSearch).some((zone) => zone.id === this.base)) {
      this.error = 'invalid'
      return
    }
    const resolved = resolveBaseTime(this.value, this.base)
    if (resolved.kind !== 'valid') {
      this.error = resolved.kind
      this.possibilities = []
      return
    }
    this.possibilities = resolved.possibilities
    if (resolved.possibilities.length > 1 && !this.choice) return
    const base =
      resolved.possibilities.find(
        (d) => String(d.toMillis()) === this.choice,
      ) ?? resolved.possibilities[0]
    if (!base) {
      this.error = 'invalid'
      return
    }
    this.results = this.targets.map((id) => {
      const { time, dayDifference } = convertTime(base, id)
      const zone = zones.find((z) => z.id === id) ?? utc
      const day =
        dayDifference === 0
          ? t('tz.same')
          : `${t(dayDifference < 0 ? 'tz.before' : 'tz.after')} (${dayDifference > 0 ? '+' : ''}${dayDifference})`
      return {
        id,
        text: `${this.label(zone).replace(/ \([^)]*\) —/, ' —')} · ${time.toFormat('yyyy-MM-dd HH:mm')} ${offsetText(time.offset)} · ${day}`,
      }
    })
  }
  private async copy(value: string) {
    try {
      await copyText(value)
      this.notice = 'copied'
    } catch {
      this.notice = 'failed'
    }
  }
  render() {
    return html`<section aria-labelledby="title">
      <h1 id="title">${t('tools.timeZone.title')}</h1>
      <p>${t('tz.hint')}</p>
      <label
        >${t('tz.date')}<input
          type="datetime-local"
          .value=${this.value}
          @input=${(e: Event) => {
            const v = (e.target as HTMLInputElement).value
            const previous = this.value.slice(0, 4)
            this.value = v
            this.clear()
            if (v.slice(0, 4) !== previous) this.scheduleOffsets()
          }}
      /></label>
      <p>
        ${t('tz.year')}: ${this.value.slice(0, 4)}
        ${this.loading ? t('tz.offsetLoading') : ''}
      </p>
      ${this.select(this.baseSearch, this.base, 'base')}
      ${this.select(this.targetSearch, this.selected, 'target')}
      <wa-button
        @click=${() => {
          if (
            this.filtered(this.targetSearch).some(
              (z) => z.id === this.selected,
            ) &&
            !this.targets.includes(this.selected)
          ) {
            this.targets = [...this.targets, this.selected]
            this.results = []
            this.error = ''
          }
        }}
        >${t('tz.add')}</wa-button
      >
      <ul>
        ${this.targets.map(
          (id) =>
            html`<li>
              ${this.label(zones.find((z) => z.id === id) ?? utc)}
              <button
                @click=${() => {
                  this.targets = this.targets.filter((target) => target !== id)
                  this.results = []
                  this.error = ''
                }}
                aria-label=${`${t('tz.remove')} ${id}`}
              >
                ${t('tz.remove')}
              </button>
            </li>`,
        )}
      </ul>
      ${
        this.possibilities.length > 1
          ? html`<fieldset>
              <legend>${t('tz.ambiguous')}</legend>
              ${this.possibilities.map(
                (date) =>
                  html`<label
                    ><input
                      type="radio"
                      name="offset"
                      .value=${String(date.toMillis())}
                      .checked=${this.choice === String(date.toMillis())}
                      @change=${() => {
                        this.choice = String(date.toMillis())
                        this.results = []
                      }}
                    />${offsetText(date.offset)}</label
                  >`,
              )}
            </fieldset>`
          : nothing
      }
      <wa-button variant="brand" @click=${this.calculate}
        >${t('tz.convert')}</wa-button
      >
      ${this.error ? html`<p role="alert">${t(this.error === 'gap' ? 'tz.gap' : this.error === 'none' ? 'tz.none' : 'tz.invalid')}</p>` : nothing}
      ${
        this.results.length
          ? html`<h2>${t('tz.results')}</h2>
              <ul>
                ${this.results.map((r) => html`<li><span>${r.text}</span> <button @click=${() => this.copy(r.text)} aria-label=${`${t('tz.copy')} ${r.id}`}>${t('tz.copy')}</button></li>`)}
              </ul>
              <wa-button
                @click=${() => this.copy(this.results.map((r) => r.text).join('\n'))}
                >${t('tz.copyAll')}</wa-button
              >`
          : nothing
      }
      ${this.notice ? html`<p role="status">${t(this.notice === 'copied' ? 'status.copied' : 'status.copyFailed')}</p>` : nothing}
    </section>`
  }
  static styles = css`
    :host {
      display: block;
      color: var(--app-text);
    }
    section {
      padding: 32px;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-lg);
      background: var(--app-surface);
      box-shadow: var(--app-shadow);
    }
    label {
      display: block;
      margin: 16px 0;
      font-weight: 600;
    }
    input:not([type='radio']),
    select {
      display: block;
      box-sizing: border-box;
      width: 100%;
      margin-top: 8px;
      padding: 10px;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
      background: var(--app-surface);
      color: var(--app-text);
      font: inherit;
    }
    input:focus-visible,
    select:focus-visible,
    button:focus-visible {
      outline: 2px solid var(--app-brand);
      outline-offset: 2px;
    }
    button {
      font: inherit;
      color: var(--app-text);
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
      padding: 8px;
    }
    li {
      margin: 12px 0;
      overflow-wrap: anywhere;
    }
    p {
      color: var(--app-muted);
    }
    @media (max-width: 700px) {
      section {
        padding: 16px;
      }
    }
  `
}
