import Interpreter from "../islands/Interpreter.tsx";

export default function Home() {
  return (
    <div>
      <header>
        <h1>Welcome to Homoiconic C!</h1>
        <p>Homoiconic C ("HC") is a universal data format for computation.</p>
        <a
          className="cheat-sheet"
          href="https://ihack.us/2024/09/19/tsm-5-homoiconic-c-hc-syntax-cheat-sheet/"
          target="_blank"
        >
          HC Cheat Sheet
        </a>
      </header>
      <main className="interpreter-wrapper">
        <h3>HCLang Interpreter</h3>
        <Interpreter />
      </main>
    </div>
  );
}
