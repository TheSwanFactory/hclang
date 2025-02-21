export interface HistoryItem {
  code: string;
  result: string;
  timestamp: number;
}

interface HistoryProps {
  history: HistoryItem[];
  onHistoryClick: (historyItem: HistoryItem) => void;
  onClearHistory: () => void;
}

export function History(
  { history, onHistoryClick, onClearHistory }: HistoryProps,
) {
  return (
    <div style={{ marginTop: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3>History</h3>
        <button
          type="reset"
          onClick={onClearHistory}
          style={{ padding: "4px 8px" }}
        >
          Clear History
        </button>
      </div>
      <div style={{ maxHeight: "200px", overflowY: "auto" }}>
        {history.map((item) => (
          <div
            key={item.timestamp}
            onClick={() => onHistoryClick(item)}
            style={{
              cursor: "pointer",
              padding: "8px",
              margin: "4px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <pre style={{ margin: 0 }}>{item.code}</pre>
            <small style={{ color: "#666" }}>
              {new Date(item.timestamp).toLocaleString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
