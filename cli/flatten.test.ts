import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import { Frame, make_context } from "../lib/mod.ts";
import { Flatten } from "./flatten.ts";
import { FrameArray } from "../lib/frames.ts";

describe("Flatten", () => {
  it("should getNode undefined if empty", () => {
    const fetchedNode = Flatten.getNode("root");
    expect(fetchedNode).toBeUndefined();
  });

  it("should create a root node correctly", () => {
    const frame = new Frame();
    const node = new Flatten(frame, "root");
    expect(node.id).toBe("root");
    expect(node.name).toBe("()");
    expect(node.parent).toBeNull();
    expect(node.children).toHaveLength(0);

    const fetchedNode = Flatten.getNode("root");
    expect(fetchedNode).toBe(node);
    expect(fetchedNode?.id).toBe("root");
  });

  it("should manually create a child node correctly", () => {
    const parentFrame = new Frame();
    const parentNode = new Flatten(parentFrame, "parent");
    expect(parentNode.id).toBe("parent");
    expect(parentNode.children).toHaveLength(0);

    const context = make_context({ key: "grandchild" });
    const childFrame = new Frame(context);
    const childNode = new Flatten(childFrame, "child", "parent");
    expect(childNode.id).toBe("parent.child");
    expect(childNode.name).toBe("(.key “grandchild”;)");
    expect(childNode.parent).toBe("parent");
    expect(childNode.children.length).toBeGreaterThan(0);
    expect(Flatten.getNode("parent.child")).toBe(childNode);
    const grandchild = Flatten.getNode("parent.child.key");
    expect(grandchild).not.toBeUndefined();
    if (grandchild) {
      expect(grandchild.toString()).toContain("grandchild");
    }
  });

  it("should handle FrameArray correctly", () => {
    const context1 = make_context({ key: "child1" });
    const context2 = make_context({ key: "child2" });
    const frameArray = new FrameArray([
      new Frame(context1),
      new Frame(context2),
    ]);
    const node = new Flatten(frameArray, "root");
    expect(node.id).toBe("root");
    expect(node.name).toBe("root");
    expect(node.parent).toBeNull();
    expect(node.children).toHaveLength(2);
    expect(node.children).toContain("root.0");
    expect(node.children).toContain("root.1");
  });

  it("should retrieve a node by its ID", () => {
    const context = make_context({ key: "root" });
    const frame = new Frame(context);
    const node = new Flatten(frame, "root");
    const retrievedNode = Flatten.getNode("root");
    expect(retrievedNode).toBe(node);
  });

  it("should return undefined for non-existent node", () => {
    const node = Flatten.getNode("nonexistent");
    expect(node).toBeUndefined();
  });

  it("should lazily load child nodes from FrameArray", () => {
    const context1 = make_context({ key: "child1" });
    const context2 = make_context({ key: "child2" });
    const frameArray = new FrameArray([
      new Frame(context1),
      new Frame(context2),
    ]);
    const rootNode = new Flatten(frameArray, "root");
    expect(rootNode.children).toHaveLength(2);
    const childNode = Flatten.getNode("root.0");
    expect(childNode).not.toBeUndefined();
    expect(childNode?.id).toBe("root.0");
    expect(childNode?.name).toBe("(.key “child1”;)");
    expect(childNode?.parent).toBe("root");
  });
});
