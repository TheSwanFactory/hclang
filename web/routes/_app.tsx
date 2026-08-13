import type { JSX } from "preact";
import { define } from "../utils.ts";

/** Provides the document shell shared by all hcweb routes. */
export default define.page(function App({ Component }): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>HCLang Playground</title>
      </head>
      <body>
        <div class="app-shell">
          <aside class="sidebar" aria-label="HC resources">
            <h2>Documentation</h2>
            <nav>
              <a href="/BitScheme.html">Homoiconic C Tutorial</a>
              <a href="/hc-paper.html">Homoiconic C White Paper</a>
              <a href="https://ihack.us/2024/09/19/tsm-5-homoiconic-c-hc-syntax-cheat-sheet/">
                HC Cheat Sheet
              </a>
            </nav>
            <h2>Links</h2>
            <nav>
              <a href="https://github.com/TheSwanFactory/hclang">GitHub</a>
              <a href="https://jsr.io/@swanfactory/hclang">
                @swanfactory/hclang
              </a>
              <a href="https://jsr.io/@swanfactory/hcweb">@swanfactory/hcweb</a>
            </nav>
          </aside>
          <div class="page">
            <main class="content">
              <Component />
            </main>
            <footer>&copy; 2026 The Swan Factory</footer>
          </div>
        </div>
      </body>
    </html>
  );
});
