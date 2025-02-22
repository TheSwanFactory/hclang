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
        <link rel="stylesheet" href="./styles.css" />
      </head>
      <body>
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
