import Main from "../islands/Main.tsx";

export default function Local() {
  return (
    <div>
      <main className="interpreter-wrapper">
        <h3>HCLang Interpreter</h3>
        <Main />
        <div className="docs-links">
          <h4>Documentation</h4>
          <ul>
            <li><a href="/static/hc-paper.html">HC Paper</a></li>
          </ul>
        </div>
      </main>
    </div>
  );
}
