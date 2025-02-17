import Interpreter from "../islands/Interpreter.tsx";

export default function Home() {
  return (
    <div>
      <head>
        <title>HCLang Playground</title>
      </head>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Homoiconic C!
        </h1>

        <p className="text-lg mb-4">
          Homoiconic C ("HC") is a universal data format for computation.
        </p>
        <a
          className="text-blue-500 hover:underline mb-4 block text-2xl"
          href="https://ihack.us/2024/09/19/tsm-5-homoiconic-c-hc-syntax-cheat-sheet/"
          target="_blank"
        >
          HC Cheat Sheet.
        </a>
        <div className="mt-8 p-4 border rounded">
          <h3 className="text-2xl font-bold mb-4">HCLang Interpreter</h3>
          <Interpreter />
        </div>
        <p className="text-lg text-gray-750 mt-4">
          Coming soon: subscribe to our mailing list.
        </p>
      </div>
    </div>
  );
}
