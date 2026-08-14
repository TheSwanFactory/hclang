import { h, render } from "preact";
import Main from "./islands/Main.tsx";

/** Mounts the complete HC playground into an existing element. */
export function mountHcweb(element: HTMLElement): void {
  render(h(Main, {}), element);
}
