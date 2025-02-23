import { HCLang } from "@swanfactory/hclang";
import { JSX } from "preact";

/**
 * Props for the Historian component
 * @interface HistorianProps
 * @property {HCLang} hclang - The HCLang instance to display history from
 */
export interface HistorianProps {
  /** The HCLang instance used to display execution history */
  hclang: HCLang;
}

/**
 * Type definition for table row data
 */
type RowData = {
  input: string;
  output: string;
  key: number;
};

/**
 * Displays the execution history from an HCLang instance.
 * Shows a table of input-output pairs from previous executions.
 *
 * @param {HistorianProps} props - Component properties
 * @param {HCLang} props.hclang - The HCLang instance to display history from
 * @returns {JSX.Element} A table showing the execution history
 */
/**
 * Component that displays the execution history from an HCLang instance
 * @param props - Component properties
 * @returns A table showing the execution history
 */
export default function Historian({ hclang }: HistorianProps): JSX.Element {
  const history = hclang.getHistory();
  return (
    <div class="mt-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">History</h2>
      <div class="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Input
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Output
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {history.reverse().map(({ input, output }, i) => (
              <tr key={i}>
                <td class="px-6 py-4 whitespace-pre-wrap">{input}</td>
                <td class="px-6 py-4 whitespace-pre-wrap">{output}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
