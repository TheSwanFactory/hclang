import { h } from "preact";
import { useState } from "preact/hooks";

interface ExecutorProps {
  onSubmit: (input: string) => Promise<void>;
  latestOutput: string;
}

export default function Executor({ onSubmit, latestOutput }: ExecutorProps) {
  const [input, setInput] = useState("");

  const handleSubmit = async () => {
    if (!input.trim()) return;
    await onSubmit(input);
    setInput("");
  };

  return (
    <div>
      <textarea
        placeholder="Enter code..."
        value={input}
        onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
      />
      <button onClick={handleSubmit}>Submit</button>
      <pre>{latestOutput || "Output will appear here"}</pre>
    </div>
  );
}
