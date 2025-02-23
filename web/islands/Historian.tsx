import { HCLang } from "@swanfactory/hclang";

interface HistorianProps {
  hclang: HCLang;
}

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
