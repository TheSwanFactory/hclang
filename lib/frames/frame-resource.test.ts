import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  containsResolved,
  Frame,
  FrameArray,
  FrameInt,
  FrameResource,
  FrameString,
  FrameURI,
  MemoryStore,
  RESOURCE_ROOT_KEY,
  type ResourceStore,
  type StoreResult,
} from "../frames.ts";
import { evaluate } from "../execute/evaluate.ts";

/** A store whose paths are symlinks, so textual containment is not enough. */
class LinkingStore implements ResourceStore {
  public reads: string[] = [];

  public constructor(
    private readonly root: string,
    private readonly links: Record<string, string> = {},
  ) {}

  public describe(): string {
    return this.root;
  }

  public read(path: string): StoreResult {
    this.reads.push(path);
    const escaped = this.resolve(path);
    return escaped ?? { ok: true, content: `bytes at ${path}` };
  }

  public write(path: string, content: string): StoreResult {
    const escaped = this.resolve(path);
    return escaped ?? { ok: true, content };
  }

  /** Re-verifies containment against the resolved location, not the text. */
  private resolve(path: string): StoreResult | undefined {
    const resolved = this.links[path] ?? `${this.root}/${path}`;
    return containsResolved(this.root, resolved)
      ? undefined
      : { ok: false, reason: "resource-escaped-root" };
  }
}

/** Evaluates source with a root binding installed in the host namespace. */
const withRoot = (source: string, store: ResourceStore = new MemoryStore()) =>
  evaluate(source, { [RESOURCE_ROOT_KEY]: FrameResource.root(store) });

/** The rendered results of one source unit, one per line. */
const results = (source: string, store?: ResourceStore): string[] =>
  withRoot(source, store).toStringArray().map((line) =>
    line.endsWith(",") ? line.slice(0, -1) : line
  );

describe("FrameResource", () => {
  it("is exported", () => {
    expect(FrameResource).toBeTruthy();
  });

  it("is a resource identifier, so a03's promises still hold of it", () => {
    const root = FrameResource.root(new MemoryStore());
    const resource = root.extend("./hc/doc");

    expect(resource).toBeInstanceOf(FrameURI);
    expect(resource.toString()).toEqual("'./hc/doc'");
    expect(resource.get("path").toString()).toEqual("“./hc/doc”");
    expect(resource.isEqualTo(new FrameURI("./hc/doc"))).toEqual(true);
  });

  it("evaluates to itself rather than resolving again", () => {
    const resource = FrameResource.root(new MemoryStore()).extend("./a");

    expect(resource.in()).toBe(resource);
    expect(resource.in([new FrameString("context")])).toBe(resource);
  });

  it("prints the root as the reference it denotes, never the host path", () => {
    const root = FrameResource.root(new MemoryStore("/tmp/secret-xyz"));

    expect(root.toString()).toEqual("'.'");
    expect(root.describeRoot()).toEqual("/tmp/secret-xyz");
  });

  describe("as a root binding", () => {
    it("resolves an identifier only when one is reachable", () => {
      expect(results("'./out.txt' “hello”")).toEqual(["5"]);
      expect(evaluate("'./out.txt' “hello”").toStringArray()).toEqual([
        "“hello”",
      ]);
    });

    it("is reachable by name, so the perimeter is enumerable", () => {
      expect(results("$$.root")).toEqual(["'.'"]);
    });

    it("attenuates by path extension, never widening", () => {
      const root = FrameResource.root(new MemoryStore());
      const child = root.extend("./a") as FrameResource;
      const grandchild = child.extend("./b/c.txt");

      grandchild.apply(new FrameString("deep"), Frame.nil);
      expect(
        root.extend("./a/b/c.txt").reduce(new FrameString("")).toString(),
      ).toEqual("“deep”");
    });

    it("carries a refusal down every extension of it", () => {
      const refused = FrameResource.root(new MemoryStore())
        .extend("../escape") as FrameResource;

      expect(refused.extend("./child").elements()[0].toString()).toEqual(
        "$!.resource-parent-escape './child'",
      );
    });
  });

  describe("writing", () => {
    it("returns the characters written, not the receiver", () => {
      const write = withRoot("'./out.txt' “hello”").at(0);

      expect(write).toBeInstanceOf(FrameInt);
      expect(write.toString()).toEqual("5");
      expect(write.toString()).not.toEqual("'./out.txt'");
    });

    it("contributes character content, and spelling from anything else", () => {
      const store = new MemoryStore();

      expect(results("'./a.txt' “x”\n'./a.txt' | “”", store)).toEqual([
        "1",
        "“x”",
      ]);
      expect(results("'./b.txt' 'c/d'\n'./b.txt' | “”", store)).toEqual([
        "5",
        "“'c/d'”",
      ]);
    });

    it("replaces rather than appends", () => {
      const store = new MemoryStore();
      results("'./a.txt' “first”", store);

      expect(results("'./a.txt' “2nd”\n'./a.txt' | “”", store)).toEqual([
        "3",
        "“2nd”",
      ]);
    });

    it("refuses a scheme before any host call", () => {
      const store = new MemoryStore();

      expect(results("'https://example.com/x' “no”", store)).toEqual([
        "$!.resource-scheme-unbound 'https://example.com/x'",
      ]);
      expect(store.read("")).toEqual({ ok: false, reason: "resource-absent" });
    });

    it("refuses a parent escape at normalization", () => {
      expect(results("'../escape' “no”")).toEqual([
        "$!.resource-parent-escape '../escape'",
      ]);
    });
  });

  describe("reading", () => {
    it("pushes characters, so the receiver decides what a read answers", () => {
      const store = new MemoryStore();

      // Nothing about the reading is a property of the source: text joins the
      // characters back into whole content, an aggregate collects them apart.
      expect(results("'./a.txt' “hi”\n'./a.txt' | “”", store)).toEqual([
        "2",
        "“hi”",
      ]);
      expect(results("'./a.txt' | []", store)).toEqual(["[“h”, “i”]"]);
      expect(results("'./a.txt' & {_}", store)).toEqual(["[“h”, “i”]"]);
    });

    it("indexes those characters under a doubled read", () => {
      const store = new MemoryStore();

      expect(results("'./a.txt' “hi”\n'./a.txt' && {_}", store)).toEqual([
        "2",
        "[[.0, “h”], [.1, “i”]]",
      ]);
    });

    it("keeps its URI components out of the stream", () => {
      const store = new MemoryStore();
      results("'./a.txt' “hi”", store);

      // The components describe the reference the value is, rather than
      // contents it holds, so they stay readable by name and never iterate.
      expect(results("'./a.txt'.path", store)).toEqual(["“./a.txt”"]);
      expect(results("'./a.txt' || []", store)).toEqual([
        "[[.0, “h”], [.1, “i”]]",
      ]);
    });

    it("answers nil for an empty location, which is not an absent one", () => {
      const store = new MemoryStore();
      const root = FrameResource.root(store);
      root.extend("./empty.txt").apply(new FrameString(""), Frame.nil);

      // Absent and empty are different facts, and only one is a failure. An
      // empty stream reduces to nil whatever it started from, while a missing
      // location answers a refusal.
      expect(root.extend("./empty.txt").elements()).toEqual([]);
      expect(root.extend("./empty.txt").reduce(new FrameString("")))
        .toEqual(Frame.nil);
      expect(results("'./nope.txt' | “”", store)).toEqual([
        "$!.resource-absent './nope.txt'",
      ]);
    });

    it("reports an absent location as a value the iterator collects", () => {
      const collected = withRoot("'./nope.txt' | []").at(0);

      expect(collected).toBeInstanceOf(FrameArray);
      expect(collected.at(0).toString()).toEqual(
        "$!.resource-absent './nope.txt'",
      );
      expect(collected.isFailedResult()).toEqual(true);
    });

    it("re-verifies containment against the resolved location", () => {
      const store = new LinkingStore("/tmp/root", {
        "link.txt": "/etc/passwd",
      });

      expect(results("'./link.txt' | []", store)).toEqual([
        "[$!.resource-escaped-root './link.txt']",
      ]);
      expect(results("'./ordinary.txt' | “”", store)).toEqual([
        "“bytes at ordinary.txt”",
      ]);
    });

    it("refuses a symlinked write before any byte moves", () => {
      const store = new LinkingStore("/tmp/root", {
        "link.txt": "/etc/passwd",
      });

      expect(results("'./link.txt' “no”", store)).toEqual([
        "$!.resource-escaped-root './link.txt'",
      ]);
    });
  });

  describe("only the enumerable path reads", () => {
    it("does not read the resource once per mention", () => {
      const store = new LinkingStore("/tmp/root");
      const resource = FrameResource.root(store).extend("./a.txt");

      // A control boundary checks every term of every statement through the
      // structural view, which is why that view must not be the reading one.
      expect(resource.isFailedResult()).toEqual(false);
      expect(resource.asArray()).toEqual([resource]);
      expect(store.reads).toEqual([]);

      resource.elements();
      expect(store.reads).toEqual(["a.txt"]);
    });

    it("mentions a resource in an expression without reading it", () => {
      const store = new LinkingStore("/tmp/root");
      results("'./a.txt'\n'./a.txt'", store);

      expect(store.reads).toEqual([]);
    });
  });
});
