import { h } from "preact";
import type { PageProps } from "$fresh/server.ts";
export default function App({ Component }: PageProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>HCLang Playground</title>
        <link
          rel="stylesheet"
          href="https://www.w3.org/StyleSheets/Core/Steely"
        />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <header>
          <h1>Welcome to Homoiconic C!</h1>
          <p>Homoiconic C ("HC") is a universal data format for computation.</p>
          <a className="cheat-sheet" href="https://ihack.us/2024/09/19/tsm-5-homoiconic-c-hc-syntax-cheat-sheet/" target="_blank">
            HC Cheat Sheet
          </a>
        </header>
        <main>
          <Component />
        </main>
        <footer style={{ color: "gray", fontSize: "0.8em" }}>
          <p>&copy; 2025 The Swan Factory</p>
        </footer>
      </body>
    </html>
  );
}
