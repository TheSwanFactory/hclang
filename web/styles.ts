/** Scoped styles embedded by the public hcweb island. */
export const HCWEB_STYLES: string = String.raw`
.hcweb {
  padding: clamp(1.5rem, 4vw, 3rem);
  color: #172033;
  background: #fff;
  border: 1px solid #dbe3ef;
  border-radius: 1rem;
  box-shadow: 0 1rem 3rem rgb(15 23 42 / 8%);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}

.hcweb *, .hcweb *::before, .hcweb *::after {
  box-sizing: border-box;
}

.hcweb .repl__header {
  margin-bottom: 2rem;
}

.hcweb .repl__header h1 {
  margin: 0.25rem 0 0.75rem;
  color: #111827;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.05;
}

.hcweb .repl__header p:last-child {
  color: #536176;
}

.hcweb .eyebrow {
  margin: 0;
  color: #4f46e5;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hcweb .executor {
  display: grid;
  gap: 0.75rem;
}

.hcweb .executor label {
  font-weight: 700;
}

.hcweb .executor textarea {
  width: 100%;
  min-height: 10rem;
  resize: vertical;
  padding: 1rem;
  color: #172033;
  background: #fff;
  border: 1px solid #b8c4d6;
  border-radius: 0.75rem;
  font: 0.95rem/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    monospace;
}
.hcweb .executor textarea:focus-visible,
.hcweb .button:focus-visible {
  outline: 3px solid #818cf8;
  outline-offset: 3px;
}

.hcweb .actions {
  display: flex;
  gap: 0.75rem;
}

.hcweb .button {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.25rem;
  color: #fff;
  border: 0;
  border-radius: 0.65rem;
  font: inherit;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.hcweb .button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.hcweb .button--primary {
  background: #4f46e5;
}

.hcweb .button--primary:hover {
  background: #3730a3;
}

.hcweb .button--danger {
  background: #b42318;
}

.hcweb .button--danger:hover {
  background: #912018;
}

.hcweb .result pre,
.hcweb .error {
  min-height: 4rem;
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  white-space: pre-wrap;
  border-radius: 0.75rem;
  font: 0.9rem/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    monospace;
}

.hcweb .result pre {
  background: #f8fafc;
  border: 1px solid #dbe3ef;
}

.hcweb .error {
  color: #7a271a;
  background: #fef3f2;
  border: 1px solid #fecdca;
}

.hcweb .history {
  margin-top: 2.5rem;
}

.hcweb .history h2 {
  margin-bottom: 1rem;
}
.hcweb .table-scroll {
  overflow-x: auto;
  border: 1px solid #dbe3ef;
  border-radius: 0.75rem;
}

.hcweb .history table {
  width: 100%;
  border-collapse: collapse;
}

.hcweb .history th,
.hcweb .history td {
  padding: 0.85rem 1rem;
  text-align: left;
  vertical-align: top;
  white-space: pre-wrap;
  border-bottom: 1px solid #e7edf5;
}

.hcweb .history th {
  color: #475569;
  background: #f8fafc;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hcweb .history tr:last-child td {
  border-bottom: 0;
}

.hcweb .empty-history {
  color: #64748b;
  text-align: center;
}

.hcweb .reset {
  margin-top: 1.5rem;
}

@media (max-width: 760px) {
  .hcweb {
    padding: 1.25rem;
  }
}
`;
