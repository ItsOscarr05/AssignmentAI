import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }

  body {
    font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
    line-height: 1.5;
    color: rgba(0, 0, 0, 0.87);
    background-color: #f5f5f5;
  }

  a {
    color: #1976d2;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #1565c0;
    }
  }

  button {
    cursor: pointer;
    font-family: inherit;
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  ::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;

    &:hover {
      background: #555;
    }
  }

  /* Selection styling */
  ::selection {
    background-color: #1976d2;
    color: white;
  }

  /* Focus outline */
  *:focus {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }

  /* Remove focus outline for mouse users */
  *:focus:not(:focus-visible) {
    outline: none;
  }

  /* Print styles */
  @media print {
    body {
      background-color: white;
    }

    .no-print {
      display: none !important;
    }
  }

  /* Responsive images */
  img {
    max-width: 100%;
    height: auto;
  }

  /* Utility classes */
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

  .text-center {
    text-align: center;
  }

  .text-right {
    text-align: right;
  }

  .text-left {
    text-align: left;
  }

  .flex {
    display: flex;
  }

  .flex-col {
    flex-direction: column;
  }

  .items-center {
    align-items: center;
  }

  .justify-center {
    justify-content: center;
  }

  .justify-between {
    justify-content: space-between;
  }

  .gap-1 {
    gap: 0.25rem;
  }

  .gap-2 {
    gap: 0.5rem;
  }

  .gap-4 {
    gap: 1rem;
  }

  .gap-8 {
    gap: 2rem;
  }

  .p-1 {
    padding: 0.25rem;
  }

  .p-2 {
    padding: 0.5rem;
  }

  .p-4 {
    padding: 1rem;
  }

  .p-8 {
    padding: 2rem;
  }

  .m-1 {
    margin: 0.25rem;
  }

  .m-2 {
    margin: 0.5rem;
  }

  .m-4 {
    margin: 1rem;
  }

  .m-8 {
    margin: 2rem;
  }

  .w-full {
    width: 100%;
  }

  .h-full {
    height: 100%;
  }

  .rounded {
    border-radius: 0.25rem;
  }

  .rounded-lg {
    border-radius: 0.5rem;
  }

  .shadow {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .shadow-lg {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

export default GlobalStyles;
