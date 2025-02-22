import { h } from "preact";

interface ResetProps {
  onReset: () => void;
}

export default function Reset({ onReset }: ResetProps) {
  return (
    <button type="button" style="background: red;" onClick={onReset}>
      Reset
    </button>
  );
}
