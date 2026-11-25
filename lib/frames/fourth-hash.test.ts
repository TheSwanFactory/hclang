import { expect } from "@std/expect";
import {
  Frame,
  FrameArray,
  FrameCount,
  FrameInt,
  FrameString,
} from "../frames.ts";
import {
  type DenumConstructor,
  installDenumConstructor,
  installRouterRecognizer,
  multiplyDenum,
  observeDenum,
  observeKDCoordinates,
} from "./fourth-hash.ts";

/**
 * The raw Denum observation's refusals that HC cannot reach (#524). This file
 * never loads the evaluator, so neither the Denum class's constructor nor the
 * router recognizer is installed until a test installs one, and each test
 * leaves them uninstalled again.
 */

/** No constructor, as before the evaluator installs one. */
const NO_CONSTRUCTOR = undefined as unknown as DenumConstructor;

/** A constructor that answers its arguments as `[count, [loads]]`, no Denum. */
const record: DenumConstructor = (count, loads) =>
  new FrameArray([count, new FrameArray([...loads])]);

/** Runs `body` with `constructor` installed, then uninstalls it. */
const withConstructor = (
  constructor: DenumConstructor,
  body: () => void,
): void => {
  installDenumConstructor(constructor);
  try {
    body();
  } finally {
    installDenumConstructor(NO_CONSTRUCTOR);
  }
};

/** Runs `body` with `router` recognized as a router of `channels`. */
const withRouter = (
  router: Frame,
  channels: Frame[],
  body: () => void,
): void => {
  installRouterRecognizer((source) => source === router ? channels : undefined);
  try {
    body();
  } finally {
    installRouterRecognizer(() => undefined);
  }
};

/** A Frame whose Size is the Int -1, not a Count. */
class NegativeSize extends Frame {
  public override sizeFor(key: string): Frame {
    return key === Frame.kLEAVES ? new FrameInt(-1n) : super.sizeFor(key);
  }
}

/** An aggregate whose Count is a string, not a Count. */
class TextCounted extends FrameArray {
  public override sizeFor(key: string): Frame {
    return key === Frame.kCOUNT ? new FrameString("two") : super.sizeFor(key);
  }
}

Deno.test("without a Denum constructor, a Denum observation is $!.denum-unavailable", () => {
  const three = new FrameArray([new FrameCount(3n)]);
  expect(observeDenum(three).toString()).toEqual("$!.denum-unavailable");
  const router = new FrameArray([]);
  withRouter(router, [], () => {
    expect(observeDenum(router).toString()).toEqual("$!.denum-unavailable");
  });
  withRouter(router, [three], () => {
    expect(observeDenum(router).toString()).toEqual("$!.denum-unavailable");
  });
});

Deno.test("a router recognized with no channels answers the Denum of Count 0 and no loads", () => {
  const router = new FrameArray([]);
  withConstructor(record, () => {
    withRouter(router, [], () => {
      expect(observeDenum(router).toString()).toEqual("[0, []]");
    });
  });
});

Deno.test("a failed source is its own raw Denum and its own KD product", () => {
  const refused = Frame.error("$!.refused");
  expect(observeDenum(refused)).toBe(refused);
  expect(multiplyDenum(refused, new FrameArray([]))).toBe(refused);
});

Deno.test("a Count or a load that is not an exact Count refuses the raw Denum", () => {
  expect(observeDenum(new TextCounted([])).toString())
    .toEqual("$!.denum-count");
  withConstructor(record, () => {
    expect(observeDenum(new FrameArray([new NegativeSize()])).toString())
      .toEqual("$!.denum-observations");
  });
});

Deno.test("when the constructor answers no Denum, .#### and &|& are $!.denum-observations", () => {
  const three = new FrameArray([new FrameCount(3n)]);
  const five = new FrameArray([new FrameCount(5n)]);
  withConstructor(record, () => {
    expect(observeDenum(three).toString()).toEqual("[1, [3]]");
    expect(observeKDCoordinates(three).toString())
      .toEqual("$!.denum-observations");
    expect(multiplyDenum(three, five).toString())
      .toEqual("$!.denum-observations");
  });
});
