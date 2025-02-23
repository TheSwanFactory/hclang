import { useState } from "preact/hooks";
import { JSX } from "preact";

/**
 * Props for the Executor component that handles command input and display
 */
export interface ExecutorProps {
  /** Callback function to handle command submission */
  onSubmit: (input: string) => Promise<void>;
  /** Most recent command output to display */
  latestOutput: string;
}

/**
 * Component that provides a textarea for entering commands and displays their output
 * @param props - Component properties
 * @returns A form with input and output areas
 */
export default function Executor(
  { onSubmit, latestOutput }: ExecutorProps,
): JSX.Element {
  const [input, setInput] = useState("");

  const handleSubmit = async () => {
    if (!input.trim()) return;
    await onSubmit(input);
    setInput("");
  };

  const handleInput = (e: JSX.TargetedEvent<HTMLTextAreaElement>) => {
    setInput(e.currentTarget.value);
  };

  return (
    <div class="space-y-4 w-full">
      <textarea
        class="w-full h-40 p-4 font-mono text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="e.g., .a 1; a + a, a * a"
        value={input}
        onInput={handleInput}
      />
      <button
        class="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
        type="button"
        onClick={handleSubmit}
      >
        Submit
      </button>
      <pre class="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm overflow-x-auto shadow-sm">
        {latestOutput || "Output will appear here"}
      </pre>
    </div>
  );
}
