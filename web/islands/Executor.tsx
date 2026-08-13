import { useState } from "preact/hooks";
import type { JSX } from "preact";

/** Properties for the HC source editor and result display. */
export interface ExecutorProps {
  onSubmit: (input: string) => Promise<void>;
  latestOutput: string;
  latestError?: string;
}

/** Collects HC source and displays the latest evaluation result. */
export default function Executor(
  { onSubmit, latestOutput, latestError = "" }: ExecutorProps,
): JSX.Element {
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    event: JSX.TargetedSubmitEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(input);
      setInput("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form class="executor" onSubmit={handleSubmit}>
      <label for="hc-source">HC source</label>
      <textarea
        id="hc-source"
        name="source"
        placeholder="e.g., .a 1; a + a, a * a"
        value={input}
        onInput={(event) => setInput(event.currentTarget.value)}
      />
      <div class="actions">
        <button
          class="button button--primary"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Running…" : "Submit"}
        </button>
      </div>

      <section class="result" aria-label="Latest result">
        {latestError
          ? <p class="error" role="alert">{latestError}</p>
          : (
            <pre data-testid="latest-output" aria-live="polite">
              {latestOutput || "Output will appear here"}
            </pre>
          )}
      </section>
    </form>
  );
}
