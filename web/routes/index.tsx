import type { JSX } from "preact";
import Main from "../islands/Main.tsx";
import { define } from "../utils.ts";

/** Renders the interactive HC playground. */
export default define.page(function Home(): JSX.Element {
  return <Main />;
});
