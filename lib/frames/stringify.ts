/**
 * Cycle-safe recursive stringification.
 *
 * Frame metadata and aggregate data are both ordinary object graphs, so a value
 * reachable from itself is representable and reachable from plain source. Every
 * recursive descent in a `toString`/`dataString` implementation routes through
 * `renderNested`, so a frame already being rendered higher in the same call
 * renders as its identity instead of recursing until the host stack overflows.
 *
 * The identity fallback follows the convention `meta_string` already uses for
 * the `>>` write-target slot, which prints an id for exactly this reason.
 */

/** The minimum a value must expose to be rendered with cycle detection. */
export interface IIdentified {
  id: string;
}

const rendering = new Set<IIdentified>();

/**
 * Renders one nested value, substituting its id if it is already being rendered.
 *
 * @param value the nested value about to be rendered
 * @param render produces the full representation of `value`
 * @returns the rendered representation, or `value.id` when the graph cycles
 */
export function renderNested(
  value: IIdentified,
  render: () => string,
): string {
  if (rendering.has(value)) {
    return value.id;
  }
  rendering.add(value);
  try {
    return render();
  } finally {
    rendering.delete(value);
  }
}
