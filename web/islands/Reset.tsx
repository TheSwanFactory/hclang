import { JSX } from "preact";

export interface ResetProps {
  onReset: () => void;
}

export default function Reset({ onReset }: ResetProps): JSX.Element {
  return (
    <button
      class="mt-8 px-6 py-3 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
      type="button"
      onClick={onReset}
    >
      Reset
    </button>
  );
}
