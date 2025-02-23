import { useState } from "preact/hooks";
import { JSX } from "preact";

interface ExecutorProps {
  onSubmit: (input: string) => Promise<void>;
  latestOutput: string;
}

export default function Executor({ onSubmit, latestOutput }: ExecutorProps): JSX.Element {
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
    <div>
      <textarea
        placeholder="e.g., .a 1; a + a, a * a"
        value={input}
        onInput={handleInput}
      />
      <button type="button" onClick={handleSubmit}>Submit</button>
      <pre>{latestOutput || "Output will appear here"}</pre>
    </div>
  );
}
