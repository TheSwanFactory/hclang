interface ResetProps {
  onReset: () => void;
}

export default function Reset({ onReset }: ResetProps) {
  return (
    <button style="background: red;" onClick={onReset}>
      Reset
    </button>
  );
}
