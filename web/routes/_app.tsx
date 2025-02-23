import { PageProps } from "$fresh/server.ts";
import { JSX } from "preact";

/**
 * Root application component that provides the HTML structure
 * @param props - Component properties including the page component to render
 * @returns The rendered application shell
 */
export default function App({ Component }: PageProps): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>HCLang Playground</title>
      </head>
      <body class="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <div class="w-64 bg-white shadow-md p-6 h-screen fixed">
          <h4 class="text-lg font-semibold text-gray-900 mb-4">Documentation</h4>
          <ul class="space-y-2">
            <li>
              <a href="./BitScheme.html" class="text-indigo-600 hover:text-indigo-800">
                Homoiconic C Tutorial
              </a>
            </li>
            <li>
              <a href="./hc-paper.html" class="text-indigo-600 hover:text-indigo-800">
                Homoiconic C White Paper
              </a>
            </li>
            <li>
              <a href="https://ihack.us/2024/09/19/tsm-5-homoiconic-c-hc-syntax-cheat-sheet/" class="text-indigo-600 hover:text-indigo-800">
                HC Cheat Sheet
              </a>
            </li>
          </ul>
          <h4 class="text-lg font-semibold text-gray-900 mt-6 mb-4">Links</h4>
          <ul class="space-y-2">
            <li>GitHub: <a href="https://github.com/theswanfactory/hclang" class="text-indigo-600 hover:text-indigo-800">swanfactory/hclang</a></li>
            <li>JSR module: <a href="https://jsr.io/@swanfactory/hclang" class="text-indigo-600 hover:text-indigo-800">@swanfactory/hclang</a></li>
          </ul>
        </div>

        {/* Main Content */}
        <div class="flex-1 ml-64 flex flex-col min-h-screen">
          <main class="flex-grow p-8">
            <Component />
          </main>

          <footer class="py-8 text-sm text-gray-500 text-center">
            <p>&copy; 2025 The Swan Factory</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
