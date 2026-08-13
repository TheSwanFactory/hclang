import type { JSX } from "preact";

/** Properties for the interpreter reset control. */
export interface ResetProps {
  onReset: () => void;
}

/** Clears interpreter state, output, errors, and history. */
export default function Reset({ onReset }: ResetProps): JSX.Element {
  return (
    <button
      class="button button--danger reset"
      type="button"
      onClick={onReset}
    >
      Reset interpreter
    </button>
  );
}
