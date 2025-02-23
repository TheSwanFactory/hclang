import { Options } from "$fresh/plugins/twind.ts";
import { apply } from "twind";

export default {
  selfURL: import.meta.url,
  theme: {
    extend: {
      fontFamily: {
        mono: ["Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      },
    },
  },
  plugins: {
    btn: apply`px-6 py-3 rounded-lg font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200`,
    'btn-primary': apply`bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500`,
    'btn-danger': apply`bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`,
  },
} as Options;
