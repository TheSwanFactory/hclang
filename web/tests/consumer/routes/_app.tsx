import type { PageProps } from "fresh";
import type { JSX } from "preact";

export default function App({ Component }: PageProps): JSX.Element {
  return (
    <html lang="en">
      <head>
        <title>hcweb consumer</title>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
