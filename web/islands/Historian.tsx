import { HCLang } from "@swanfactory/hclang";

/**
 * Props for the Historian component
 * @interface HistorianProps
 * @property {HCLang} hclang - The HCLang instance to display history from
 */
interface HistorianProps {
  hclang: HCLang;
}

/**
 * Displays the execution history from an HCLang instance.
 * Shows a table of input-output pairs from previous executions.
 * 
 * @param {HistorianProps} props - Component properties
 * @param {HCLang} props.hclang - The HCLang instance to display history from
 * @returns {JSX.Element} A table showing the execution history
 */
export default function Historian({ hclang }: HistorianProps) {
  const history = hclang.getHistory();
  return (
    <div class="history">
      <h2>History</h2>
      <table>
        <thead>
          <tr>
            <th>Input</th>
            <th>Output</th>
          </tr>
        </thead>
        <tbody>
          {history.map(({ input, output }, i) => (
            <tr key={i}>
              <td class="input">{input}</td>
              <td class="output">{output}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
