import {
  Frame,
  FrameArg,
  FrameExpr,
  FrameString,
  FrameSymbol,
} from "./frames.ts";
import { tag } from "../maml/tag.ts";

const HTML_PREFIX = "<!DOCTYPE html>";

const MakeTag = (name: string, contents: Frame) => {
  return new FrameExpr([
    new FrameSymbol("tag"),
    new FrameString(name),
    contents,
  ]);
};

/** Render public metadata only, using its stored names as tag text.
 *
 * Doubled iteration now supplies address/value tuples, and an address is not
 * character content. Keep that conversion at this host rendering boundary;
 * neither element contents nor interpreter-private properties belong in head.
 */
class MetadataHead extends Frame {
  public override call(argument: Frame): Frame {
    const source = argument.referent();
    let result: Frame = new FrameString("");
    for (const key of source.visibleKeys()) {
      const element = tag.call(new FrameString(key)).call(source.get_here(key));
      result = result.call(element);
    }
    return result;
  }
}

const head = MakeTag(
  "head",
  new FrameExpr([new MetadataHead(), FrameArg.here()]),
);
const body = MakeTag("body", FrameArg.here());

export const maml = new FrameExpr([
  new FrameString(HTML_PREFIX),
  MakeTag("html", new FrameExpr([head, body])),
], { tag });
