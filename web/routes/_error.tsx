import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import type { JSX } from "preact";
import { define } from "../utils.ts";

/** Renders both not-found and unexpected application errors. */
export default define.page(function ErrorPage({ error }): JSX.Element {
  const status = error instanceof HttpError ? error.status : 500;
  const title = status === 404 ? "Page not found" : "Unexpected error";

  return (
    <section class="error-page">
      <Head>
        <title>{status} - {title}</title>
      </Head>
      <p class="eyebrow">Error {status}</p>
      <h1>{title}</h1>
      <p>The requested page could not be displayed.</p>
      <a class="button button--primary" href="/">Return to the playground</a>
    </section>
  );
});
