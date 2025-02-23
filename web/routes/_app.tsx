import { PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>HCLang Playground</title>
      </head>
      <body class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <header class="pt-8 pb-4">
            <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Welcome to Homoiconic C!
            </h1>
            <p class="text-xl text-gray-600 mb-8">
              Homoiconic C ("HC") is a universal data format for computation.
            </p>
            <div class="bg-white rounded-lg shadow-sm p-6 mb-4">
              <h4 class="text-lg font-semibold text-gray-900 mb-4">
                Documentation
              </h4>
              <ul class="space-y-2">
                <li>
                  <a
                    href="./BitScheme.html"
                    class="text-indigo-600 hover:text-indigo-800"
                  >
                    Homoiconic C Tutorial (BitScheme)
                  </a>
                </li>
                <li>
                  <a
                    href="./hc-paper.html"
                    class="text-indigo-600 hover:text-indigo-800"
                  >
                    Homoiconic C White Paper
                  </a>
                </li>
                <li>
                  <a
                    href="https://ihack.us/2024/09/19/tsm-5-homoiconic-c-hc-syntax-cheat-sheet/"
                    class="text-indigo-600 hover:text-indigo-800"
                  >
                    HC Cheat Sheet
                  </a>
                </li>
              </ul>
            </div>
          </header>

          <main class="py-8">
            <Component />
          </main>

          <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Links</h4>
            <ul class="space-y-2">
              <li>
                Single-File Version:
                <a
                  href="./hclang.html"
                  class="text-indigo-600 hover:text-indigo-800"
                >
                  hclang.html
                </a>
              </li>
              <li>
                Github:
                <a
                  href="https://github.com/swanfactory/hclang"
                  class="text-indigo-600 hover:text-indigo-800"
                >
                  swanfactory/hclang
                </a>
              </li>
              <li>
                JSR module:
                <a
                  href="https://jsr.io/@swanfactory/hclang"
                  class="text-indigo-600 hover:text-indigo-800"
                >
                  @swanfactory/hclang
                </a>
              </li>
            </ul>
          </div>

          <footer class="py-8 text-sm text-gray-500 text-center">
            <p>&copy; 2025 The Swan Factory</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
