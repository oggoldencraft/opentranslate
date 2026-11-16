import { css } from 'lit';

export const sharedStyles = css`
  :host {
    box-sizing: border-box;
    font-family: var(--md-ref-typeface-plain, 'Roboto', system-ui, sans-serif);
    color: var(--md-sys-color-on-surface);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  button:focus-visible,
  [tabindex]:focus-visible,
  textarea:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
  }

  md-icon {
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-style: normal;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-smoothing: antialiased;
  }
`;
