
import { expect } from "chai";
import {} from "mocha";
import { FrameNote, FrameString, FrameSymbol } from "../../src/frames";

describe("FrameNote", () => {
  const key = "key";
  const frame_note = FrameNote.key(key);

  it("is created from a string", () => {
    expect(frame_note).to.be.instanceOf(FrameNote);
  });

  it("stringifies with a dollar prefix", () => {
    expect(frame_note.toString()).to.equal("$!.name-missing “key”;");
  });

  it("evaluates to itself", () => {
    const result = frame_note.in();
    expect(result.toString()).to.equal(frame_note.toString());
  });

  it("is returned by unbound symbols", () => {
    const context = new FrameString("context");
    const symbol = FrameSymbol.for(key);
    const result = symbol.in([context]);
    expect(result).to.be.instanceOf(FrameNote);
    const resultString = result.toString();
    expect(resultString).to.include(key);
    expect(resultString).to.include(context.id);
  });
});
