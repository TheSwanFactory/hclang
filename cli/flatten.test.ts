import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import { Frame, make_context } from "../lib/mod.ts";
import { Flatten } from "./flatten.ts";
import { FrameArray } from "../lib/frames.ts";

describe("Flatten", () => {
  it("should getNode undefined if empty", () => {
    const fetchedNode = Flatten.getNode("root");
    expect(fetchedNode).to.equal(undefined);
  });

  it("should create a root node correctly", () => {
    const frame = new Frame();
    const node = new Flatten(frame, "root");
    expect(node.id).to.equal("root");
    expect(node.name).to.equal("()");
    expect(node.parent).to.be.null;
    expect(node.children).to.be.empty;

    const fetchedNode = Flatten.getNode("root");
    expect(fetchedNode).to.equal(node);
    expect(fetchedNode?.id).to.equal("root");
  });

  it("should manually create a child node correctly", () => {
    const parentFrame = new Frame();
    const parentNode = new Flatten(parentFrame, "parent");
    expect(parentNode.id).to.equal("parent");
    expect(parentNode.children).to.be.empty;

    const context = make_context({ key: "grandchild" });
    const childFrame = new Frame(context);
    const childNode = new Flatten(childFrame, "child", "parent");
    expect(childNode.id).to.equal("parent.child");
    expect(childNode.name).to.equal("(.key “grandchild”;)");
    expect(childNode.parent).to.equal("parent");
    expect(childNode.children).to.not.be.empty;
    expect(Flatten.getNode("parent.child")).to.equal(childNode);
    const grandchild = Flatten.getNode("parent.child.key");
    expect(grandchild).to.not.equal(undefined);
    if (grandchild) {
      expect(grandchild.toString()).to.contain("grandchild");
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
    expect(node.id).to.equal("root");
    expect(node.name).to.equal("root");
    expect(node.parent).to.be.null;
    expect(node.children).to.have.lengthOf(2);
    expect(node.children).to.include("root.0");
    expect(node.children).to.include("root.1");
  });

  it("should retrieve a node by its ID", () => {
    const context = make_context({ key: "root" });
    const frame = new Frame(context);
    const node = new Flatten(frame, "root");
    const retrievedNode = Flatten.getNode("root");
    expect(retrievedNode).to.equal(node);
  });

  it("should return undefined for non-existent node", () => {
    const node = Flatten.getNode("nonexistent");
    expect(node).to.be.undefined;
  });

  it("should lazily load child nodes from FrameArray", () => {
    const context1 = make_context({ key: "child1" });
    const context2 = make_context({ key: "child2" });
    const frameArray = new FrameArray([
      new Frame(context1),
      new Frame(context2),
    ]);
    const rootNode = new Flatten(frameArray, "root");
    expect(rootNode.children).to.have.lengthOf(2);
    const childNode = Flatten.getNode("root.0");
    expect(childNode).to.not.be.undefined;
    expect(childNode?.id).to.equal("root.0");
    expect(childNode?.name).to.equal("(.key “child1”;)");
    expect(childNode?.parent).to.equal("root");
  });
});
