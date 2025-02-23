import { defineConfig } from "twind";
// @ts-ignore: No types available
import presetTailwind from "@twind/preset-tailwind";

export default {
  ...defineConfig({
    presets: [presetTailwind()],
    theme: {
      extend: {
        fontFamily: {
          mono: ["Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
        },
      },
    },
  }),
  selfURL: import.meta.url,
};
