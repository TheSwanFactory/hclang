
interface HistoryItem {
  input: string;
  output: string;
}

interface HistorianProps {
  history: HistoryItem[];
}

export default function Historian({ history }: HistorianProps) {
  return (
    <div>
      <h2>History</h2>
      <table>
        <thead>
          <tr>
            <th>Input</th>
            <th>Output</th>
          </tr>
        </thead>
        <tbody>
          {history.map(({ input, output }) => (
            <tr>
              <td>{input}</td>
              <td>{output}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
