import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  containsResolved,
  decomposeReference,
  joinNormalized,
  normalizeReference,
} from "../frames.ts";

/** The normalized path, or the refusal reason, as one comparable string. */
const outcome = (reference: string): string => {
  const result = normalizeReference(reference);
  return result.ok ? result.path : `!${result.reason}`;
};

describe("decomposeReference", () => {
  it("splits a full reference into RFC 3986 components", () => {
    expect(decomposeReference("https://example.com/hc/doc?v=1#top")).toEqual({
      scheme: "https",
      authority: "example.com",
      path: "/hc/doc",
      query: "v=1",
      fragment: "top",
    });
  });

  it("keeps a port inside the authority", () => {
    expect(decomposeReference("https://host:8080/x")).toEqual({
      scheme: "https",
      authority: "host:8080",
      path: "/x",
    });
  });

  it("omits components the reference does not have", () => {
    expect(decomposeReference("hc/doc")).toEqual({ path: "hc/doc" });
  });

  it("treats a colon in a first segment as a scheme, per RFC 3986", () => {
    expect(decomposeReference("a:b")).toEqual({ scheme: "a", path: "b" });
    expect(decomposeReference("C:/tmp/x")).toEqual({
      scheme: "C",
      path: "/tmp/x",
    });
  });

  it("makes the RFC's own dot-segment remedy a plain path", () => {
    expect(decomposeReference("./C:/tmp/x")).toEqual({ path: "./C:/tmp/x" });
  });
});

describe("normalizeReference", () => {
  it("reduces relative, root-relative, and bare paths identically", () => {
    expect(outcome("./out.txt")).toEqual("out.txt");
    expect(outcome("/out.txt")).toEqual("out.txt");
    expect(outcome("out.txt")).toEqual("out.txt");
  });

  it("drops empty and current-directory segments", () => {
    expect(outcome("./a//./b/c.txt")).toEqual("a/b/c.txt");
  });

  it("normalizes the root itself to the empty path", () => {
    expect(outcome(".")).toEqual("");
    expect(outcome("./")).toEqual("");
  });

  it("is total: every input yields a decision, never a throw", () => {
    for (
      const reference of [
        ".",
        "..",
        "%",
        "%zz",
        "%C3",
        "a:b",
        "//host",
        "\\",
        "a".repeat(4096),
      ]
    ) {
      expect(typeof outcome(reference)).toEqual("string");
    }
  });

  describe("refusals", () => {
    it("refuses a scheme, because every handler slot is empty", () => {
      expect(outcome("https://example.com/x")).toEqual(
        "!resource-scheme-unbound",
      );
      expect(outcome("jsr:@swanfactory/hclang")).toEqual(
        "!resource-scheme-unbound",
      );
    });

    it("refuses a single-letter scheme without a drive-letter heuristic", () => {
      expect(outcome("C:/tmp/x")).toEqual("!resource-scheme-unbound");
      expect(outcome("a:b")).toEqual("!resource-scheme-unbound");
      expect(outcome("./C:/tmp/x")).toEqual("C:/tmp/x");
    });

    it("refuses an authority no scheme could have selected a handler for", () => {
      expect(outcome("//example.com/x")).toEqual(
        "!resource-authority-unbound",
      );
    });

    it("refuses a query or a fragment, which a path cannot carry", () => {
      expect(outcome("./out.txt?v=1")).toEqual("!resource-part-unsupported");
      expect(outcome("./out.txt#top")).toEqual("!resource-part-unsupported");
    });

    it("refuses every parent segment, not only the escaping ones", () => {
      expect(outcome("../escape")).toEqual("!resource-parent-escape");
      expect(outcome("./a/../b")).toEqual("!resource-parent-escape");
      expect(outcome("./a/..")).toEqual("!resource-parent-escape");
    });

    it("refuses an alternate separator", () => {
      expect(outcome("..\\escape")).toEqual("!resource-alternate-separator");
      expect(outcome("./a\\b")).toEqual("!resource-alternate-separator");
    });

    it("refuses a control character", () => {
      expect(outcome("./a\u0000b")).toEqual("!resource-control-character");
    });

    it("refuses escapes that would reintroduce a separator or dot", () => {
      for (
        const reference of [
          "./%2e%2e/escape",
          "./%2E%2E/escape",
          "./a%2fb",
          "./a%2Fb",
          "./a%5Cb",
          "./a%00b",
        ]
      ) {
        expect(outcome(reference)).toEqual("!resource-encoded-separator");
      }
    });

    it("refuses a malformed escape", () => {
      expect(outcome("./a%")).toEqual("!resource-invalid-encoding");
      expect(outcome("./a%zz")).toEqual("!resource-invalid-encoding");
      expect(outcome("./a%C3")).toEqual("!resource-invalid-encoding");
    });

    it("refuses an escape that is not valid UTF-8", () => {
      expect(outcome("./a%C3%28b")).toEqual("!resource-invalid-encoding");
    });

    it("decodes escapes that carry no structural meaning", () => {
      expect(outcome("./a%20b.txt")).toEqual("a b.txt");
      expect(outcome("./caf%C3%A9.txt")).toEqual("café.txt");
    });
  });
});

describe("containsResolved", () => {
  it("accepts the root and its descendants", () => {
    expect(containsResolved("/tmp/root", "/tmp/root")).toEqual(true);
    expect(containsResolved("/tmp/root", "/tmp/root/a/b")).toEqual(true);
  });

  it("refuses a sibling whose name merely starts with the root's", () => {
    expect(containsResolved("/tmp/root", "/tmp/root-elsewhere")).toEqual(false);
  });

  it("refuses a parent and an unrelated location", () => {
    expect(containsResolved("/tmp/root", "/tmp")).toEqual(false);
    expect(containsResolved("/tmp/root", "/etc/passwd")).toEqual(false);
  });

  it("tolerates a root already ending in a separator", () => {
    expect(containsResolved("/tmp/root/", "/tmp/root/a")).toEqual(true);
  });

  it("refuses everything when there is no root", () => {
    expect(containsResolved("", "/anything")).toEqual(false);
  });
});

describe("joinNormalized", () => {
  it("extends a parent path with a child", () => {
    expect(joinNormalized("a", "b/c")).toEqual("a/b/c");
  });

  it("treats the empty path as the root", () => {
    expect(joinNormalized("", "b")).toEqual("b");
    expect(joinNormalized("a", "")).toEqual("a");
  });
});
