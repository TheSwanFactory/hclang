#!/usr/bin/env node
const RUNDOC = "#!/usr/bin/env hc \n```\n";
const ENDDOC = "```\n";

function is_doc(file: string) {
  const file_ext = file.split(".").pop();
  return file_ext === "adoc" || file_ext === "md";
}

/**
 * Asynchronously reads and processes a file line by line, passing each line to the provided `hc_eval` object's `call` method.
 * If the file is a documentation file, it will also call `RUNDOC` at the beginning and `ENDDOC` at the end.
 *
 * @param hc_eval - An object with a `call` method that processes each line of the file.
 * @param file - The path to the file to be read and processed.
 * @returns A promise that resolves to `true` when the file has been successfully processed.
 */
async function runfile(
  hc_eval: { call: (line: string) => void },
  file: string,
): Promise<boolean> {
  const is_doc_file = is_doc(file);

  if (is_doc_file) {
    hc_eval.call(RUNDOC);
  }

  const decoder = new TextDecoder();
  const fileReader = await Deno.open(file, { read: true });
  const buffer = new Uint8Array(1024);
  let partialLine = "";

  try {
    while (true) {
      const nread = await fileReader.read(buffer);
      if (nread === null || nread === 0) break;

      // Decode the chunk and split into lines
      const chunk = decoder.decode(buffer.subarray(0, nread));
      const lines = (partialLine + chunk).split("\n");
      partialLine = lines.pop() || ""; // Save any incomplete line

      for (const line of lines) {
        hc_eval.call(line.trim());
      }
    }

    // Process any remaining partial line
    if (partialLine) {
      hc_eval.call(partialLine.trim());
    }

    if (is_doc_file) {
      hc_eval.call(ENDDOC);
    }
  } finally {
    fileReader.close();
  }

  return true;
}

export { runfile };
