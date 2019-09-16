
import { expect } from "chai";
import {} from "mocha";
import { Terminal } from "../../src/execute/terminals";
import { Frame, FrameArray, FrameNote, FrameString, FrameSymbol } from "../../src/frames";
import { ICurryFunction } from "../../src/ops";

describe("FrameNote", () => {
  const key = "key";
  const frame_note = FrameNote.key(key, Frame.nil);

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

  it("captures extras when called", () => {
    const extra1 = new FrameString("x");
    const extra2 = new FrameString("tra");

    frame_note.call(extra1);
    let extra = frame_note.get(FrameNote.NOTE_EXTRAS);
    expect(extra.toString()).to.include("x");

    frame_note.call(extra2);
    extra = frame_note.get(FrameNote.NOTE_EXTRAS);
    expect(extra.toString()).to.include("x");
    expect(extra.toString()).to.include("tra");
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

  it.only("sends to kOUT on kEND", () => {
    const terminate: ICurryFunction = (source: Frame, parameter: Frame) => {
      return Frame.nil;
    };

    const out = new FrameArray([]);
    out.set(Frame.kOUT, out);
    out.set(Frame.kEND, new Terminal(terminate));
    const note = FrameNote.key(key, out);
    expect(note.get(Frame.kOUT)).to.equal(out);

    note.call(FrameSymbol.end());
    expect(out.length()).to.equal(1);
    const result = out.at(0);
    expect(result).to.equal(note);
  });

});
