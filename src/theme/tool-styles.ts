import { css } from 'lit'

/** Opt-in tool styles. Include in a tool's static styles; never import in the shell. */
export const toolStyles = css`
  :host {
    --tool-surface: light-dark(#ffffff, #202226);
    --tool-field: light-dark(#f3f4f6, #2b2e34);
    --tool-text: light-dark(#20242b, #f2f4f6);
    --tool-muted: light-dark(#626975, #aeb5bf);
    --tool-primary: light-dark(#2563eb, #3978f6);
    --tool-focus: light-dark(#2563eb, #83afff);
    --tool-error-bg: light-dark(#fff0f0, #42272c);
    --tool-error-text: light-dark(#b42332, #ffb4bd);
    --wa-color-brand-fill-loud: var(--tool-primary);
    --wa-color-brand-on-loud: #ffffff;
    --wa-color-focus: var(--tool-focus);
    --wa-form-control-background-color: var(--tool-field);
    --wa-form-control-border-color: transparent;
    --wa-form-control-border-radius: 14px;
    --wa-form-control-value-color: var(--tool-text);
    --wa-form-control-label-color: var(--tool-muted);
    display: block;
    color: var(--tool-text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .tool {
    padding: 32px;
    border-radius: 24px;
    background: var(--tool-surface);
  }
  h1 {
    margin: 0 0 12px;
    font-size: clamp(1.75rem, 4vw, 2rem);
    line-height: 1.3;
    letter-spacing: -0.03em;
  }
  .description {
    margin: 0 0 32px;
    color: var(--tool-muted);
    line-height: 1.6;
  }
  label {
    display: block;
    margin: 0 0 12px;
    font-weight: 600;
  }
  textarea {
    display: block;
    box-sizing: border-box;
    width: 100%;
    min-height: 220px;
    padding: 20px;
    border: 1px solid transparent;
    border-radius: 16px;
    background: var(--tool-field);
    color: var(--tool-text);
    font:
      14px/1.65 ui-monospace,
      monospace;
    resize: vertical;
  }
  textarea::placeholder {
    color: var(--tool-muted);
    opacity: 1;
  }
  textarea:focus-visible {
    outline: 2px solid var(--tool-focus);
    outline-offset: 3px;
  }
  wa-button::part(button) {
    min-height: 48px;
    padding-inline: 20px;
    border-radius: 14px;
    box-shadow: none;
    font-size: 1rem;
    font-weight: 600;
  }
  wa-button:not([variant='brand'])::part(button) {
    background: var(--tool-field);
    border-color: transparent;
    color: var(--tool-text);
  }
  wa-button[appearance='plain']::part(button) {
    background: transparent;
    color: var(--tool-muted);
  }
  wa-button::part(button):focus-visible {
    outline: 2px solid var(--tool-focus);
    outline-offset: 3px;
  }
  .error {
    padding: 16px;
    border-radius: 14px;
    background: var(--tool-error-bg);
    color: var(--tool-error-text);
    line-height: 1.5;
  }
  .result-actions span {
    color: var(--tool-muted);
    font-size: 0.875rem;
    line-height: 1.5;
  }
  @media (max-width: 600px) {
    .tool {
      padding: 24px 16px;
      border-radius: 20px;
    }
    textarea {
      padding: 16px;
      font-size: 16px;
    }
  }
  @media (forced-colors: active) {
    textarea,
    wa-button::part(button) {
      border: 1px solid ButtonText;
    }
  }
`
