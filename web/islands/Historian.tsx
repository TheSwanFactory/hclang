import type { HCLang } from "@swanfactory/hclang";
import type { JSX } from "preact";

/** Properties for the HC execution history. */
export interface HistorianProps {
  hclang: HCLang;
  /** Forces a refresh after the mutable interpreter changes. */
  revision?: number;
}

/** Displays the interpreter's newest input/output pair first. */
export default function Historian(
  { hclang, revision: _revision }: HistorianProps,
): JSX.Element {
  const history = [...hclang.getHistory()].reverse();

  return (
    <section class="history" aria-labelledby="history-heading">
      <h2 id="history-heading">History</h2>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Input</th>
              <th scope="col">Output</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0
              ? (
                <tr>
                  <td class="empty-history" colSpan={2}>No evaluations yet.</td>
                </tr>
              )
              : history.map(({ input, output }, index) => (
                <tr key={`${history.length - index}-${input}`}>
                  <td>{input}</td>
                  <td>{output}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
