/**
 * The RotorRouter class, loaded from HC for list division.
 *
 * Dividing a list, `xs ./ n`, deals its elements into n channels and answers
 * them as a `RotorRouter`, the HC class in `hc/rotor-router.hc`, so that the
 * channels stay channels and a further division reads them breadth-first
 * (occurrence/figure 007.27c). The ops package deals natively but cannot run
 * HC, so this module installs the constructor it calls
 * (`installDivisionCarrier`).
 *
 * As with the Demi class (`demi-prologue.ts`), the class is read from the
 * compiled-in bundle, evaluated once per process on first use, in a namespace
 * of its own with no host bindings and no root, and its outcome is kept,
 * failure included. A division requested while the file is still loading is
 * `$!.router-prologue-reentrant`.
 *
 * @module
 */
import {
  EvaluationScope,
  Frame,
  FrameArray,
  FrameExpr,
  installRouterRecognizer,
} from "../frames.ts";
import { installDivisionCarrier } from "../ops/math.ts";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { evaluateSourceText } from "./resource-import.ts";

/** The bundled file that defines the class. */
export const ROUTER_SOURCE = "hc/rotor-router.hc";

/** The name the file declares the constructor under. */
export const ROUTER_CLASS = "RotorRouter";

/**
 * The builders the class file declares beside its constructor, which make an
 * instance from channels already known to be admissible, without validating
 * or copying them: `binary-router` for two channels, `channel-router` for any
 * other number.
 */
export const ROUTER_BUILDERS = ["binary-router", "channel-router"] as const;

let loaded: Frame | undefined;
let builders: { binary: Frame; channel: Frame } | undefined;
let loading = false;

/**
 * Evaluates class source in a namespace of its own, answering its
 * `RotorRouter` or the failure. Uncached: `routerClass` keeps the one result.
 *
 * @param source The source text, or undefined when the bundle lacks it.
 * @returns The constructor, or an error.
 */
export function loadRouterClass(source: string | undefined): Frame {
  if (source === undefined) {
    return Frame.error(`$!.router-prologue-missing ${ROUTER_SOURCE}`);
  }
  const namespace = new FrameArray([]);
  const result = evaluateSourceText(source, EvaluationScope.root(namespace));
  if (result.isFailedResult() || result.observationError()) return result;
  const constructor = namespace.getOwn(ROUTER_CLASS);
  if (constructor.is.missing) {
    return Frame.error(`$!.router-prologue-missing ${ROUTER_CLASS}`);
  }
  const [binary, channel] = ROUTER_BUILDERS.map((key) => namespace.getOwn(key));
  if (binary.is.missing || channel.is.missing) {
    return Frame.error(`$!.router-prologue-missing ${ROUTER_BUILDERS}`);
  }
  builders = { binary, channel };
  return constructor;
}

/**
 * The `RotorRouter` constructor closure, evaluated from the bundle on first
 * use.
 *
 * @returns The constructor, or the error that loading it answered.
 */
export function routerClass(): Frame {
  if (loaded) return loaded;
  if (loading) return Frame.error("$!.router-prologue-reentrant");
  loading = true;
  try {
    loaded = loadRouterClass(HC_SOURCES.get(ROUTER_SOURCE));
  } finally {
    loading = false;
  }
  return loaded;
}

/**
 * Constructs a router with the HC class: `RotorRouter [ch0, …, chk−1]`.
 *
 * @param channels The channel arrays, in order.
 * @returns The new instance, or the class's failure.
 */
export function constructRouter(channels: FrameArray): Frame {
  const constructor = routerClass();
  if (constructor.isFailedResult() || constructor.observationError()) {
    return constructor;
  }
  return FrameExpr.answeredValue(constructor.call(channels)).referent();
}

/**
 * The channels of an instance of the shipped class with other than two
 * channels, for `.####` (007.27); undefined for anything else.
 *
 * Recognition mirrors the Demi's (007.25e): the source's own stored
 * `channels`, a list of arrays, must rebuild through the constructor into a
 * router `==` to the source, fields and methods included. Nothing of the
 * source runs, so a record that only spells `channels` is not a router.
 *
 * @param source The observed Frame.
 * @returns The stored channel arrays, or undefined.
 */
export function channelRouterChannels(source: Frame): Frame[] | undefined {
  const host = source.referent();
  if (!host.ownsIdentity()) return undefined;
  const stored = host.get_here("channels").referent();
  if (!(stored instanceof FrameArray)) return undefined;
  const channels = stored.elements().map((channel) => channel.referent());
  if (channels.length === 0 || channels.length === 2) return undefined;
  if (!channels.every((channel) => channel instanceof FrameArray)) {
    return undefined;
  }
  const candidate = constructRouter(
    new FrameArray(
      channels.map((channel) => new FrameArray([...channel.elements()])),
    ),
  );
  if (candidate.isFailedResult() || candidate.observationError()) {
    return undefined;
  }
  return candidate.typeEquals(host) === Frame.all ? channels : undefined;
}

/**
 * The router a list division answers, from the channels it just dealt.
 *
 * Dealt channels are fresh arrays and a round-robin profile by construction,
 * so they go straight to the class's own builder: validating and copying them
 * through the public constructor costs a closure call per channel, which made
 * a router's breadth-first readout (a division by its longest channel's
 * length) dominate its division (PR #482 review). The instance is the one the
 * constructor would build from the same channels.
 *
 * @param channels The dealt channel arrays, at least one.
 * @returns The new router, or the class's failure.
 */
export function dealtRouter(channels: FrameArray): Frame {
  const constructor = routerClass();
  if (constructor.isFailedResult() || constructor.observationError()) {
    return constructor;
  }
  if (!builders) return Frame.error("$!.router-unavailable /");
  const build = channels.elements().length === 2
    ? builders.binary
    : builders.channel;
  return FrameExpr.answeredValue(build.call(channels)).referent();
}

installDivisionCarrier(dealtRouter);
installRouterRecognizer(channelRouterChannels);
