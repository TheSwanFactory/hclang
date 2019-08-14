
import { expect } from "chai";
import {} from "mocha";
import { FrameNote } from "../../src/frames";

describe("FrameNote", () => {
  const symbol = "key";
  const frame_note = new FrameNote(symbol);

  it("is created from a string", () => {
    expect(frame_note).to.be.instanceOf(FrameNote);
  });

  it("stringifies with a dollar prefix", () => {
    expect(frame_note.toString()).to.equal("${key}");
  });

  it("evaluates to itself", () => {
    const result = frame_note.in();
    expect(result.toString()).to.equal(frame_note.toString());
  });

});
