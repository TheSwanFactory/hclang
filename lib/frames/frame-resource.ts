/**
 * A resource identifier that has found its authority.
 *
 * `'…'` is the resource. There is no resolver protocol beside a resource
 * protocol: the reference a program wrote is the thing it acts on, once a root
 * binding is reachable in the invocation context. Both verbs reuse dispatch the
 * evaluator already has — application writes, and `|` and `&` read through the
 * enumerable protocol — so there is no I/O primitive to name and no separate
 * resolver Frame to construct.
 *
 * This extends `FrameURI` rather than replacing it because everything a03
 * promises about a resource identifier still has to hold. A resource prints as
 * the reference it was written as, compares by that reference, and publishes the
 * same RFC 3986 components. What it adds is the authority, and the authority is
 * private: the store is a TypeScript field, never metadata, so it is not
 * reachable by property enumeration.
 *
 * @module
 */
import { Frame } from "./frame.ts";
import { FrameInt } from "./frame-int.ts";
import { FrameString } from "./frame-string.ts";
import { FrameURI } from "./frame-uri.ts";
import { hasCharacterContent } from "./frame-text.ts";
import type { ResourceBinding } from "./resource-binding.ts";
import type { ResourceStore } from "./resource-store.ts";
import {
  joinNormalized,
  type Normalization,
  normalizeReference,
} from "./resource-reference.ts";

/** The reference a root binding prints and normalizes as itself. */
const ROOT_REFERENCE = ".";

export class FrameResource extends FrameURI implements ResourceBinding {
  /**
   * Creates the root binding a harness installs.
   *
   * The root is a resource at the empty path, which is what makes extension the
   * only operation and attenuation structural rather than checked: a child is a
   * longer path on the same store, and no path is shorter than the empty one.
   */
  public static root(store: ResourceStore): FrameResource {
    return new FrameResource(ROOT_REFERENCE, store, { ok: true, path: "" });
  }

  /**
   * @param reference The reference as written, which stays the printed form.
   * @param store The host seam this resource and its children share.
   * @param location The normalization decided before this frame existed.
   */
  private constructor(
    reference: string,
    private readonly store: ResourceStore,
    private readonly location: Normalization,
  ) {
    super(reference);
  }

  /**
   * Extends this binding by one reference.
   *
   * Normalization runs here, before any dispatch could select a handler, and it
   * is pure: a refused reference still yields a resource, carrying its refusal.
   * Surfacing the refusal at construction instead would make evaluating
   * `'https://example.com/x'` an error, and a03 requires evaluation to be inert.
   */
  public extend(reference: string): Frame {
    return new FrameResource(reference, this.store, this.locate(reference));
  }

  /** A resource is a value, and evaluating one performs no access. */
  public override in(): Frame {
    return this;
  }

  /**
   * Application writes, and returns the evidence rather than the receiver.
   *
   * A receiver-returning call hides errors in its result, so the count of
   * characters written is the answer: it is checkable, and a refusal cannot
   * masquerade as it.
   */
  public override apply(argument: Frame, _parameter: Frame = Frame.nil): Frame {
    const path = this.contained();
    if (path === undefined) return this.refusal();

    const content = hasCharacterContent(argument)
      ? argument.characterContent()
      : argument.toString();
    const written = this.store.write(path, content);
    return written.ok
      ? FrameInt.for(written.content.length.toString())
      : this.storeRefusal(written.reason);
  }

  /**
   * Reads, because `asArray` is the whole protocol `|` and `&` require.
   *
   * One element holding the whole content: the element type travelling with the
   * resource is #368, and choosing lines here would have decided that by
   * accident. A refusal is the element, so it flows back through the iterator as
   * an ordinary value.
   */
  public override asArray(): Array<Frame> {
    const path = this.contained();
    if (path === undefined) return [this.refusal()];

    const read = this.store.read(path);
    return [
      read.ok ? new FrameString(read.content) : this.storeRefusal(read.reason),
    ];
  }

  /**
   * Failure is read from the flag alone, never by enumerating.
   *
   * The inherited implementation asks `asArray`, and `FrameExpr` asks this of
   * every term of every statement, so inheriting it would read the resource once
   * per mention.
   */
  public override isFailedResult(): boolean {
    return this.is.error === true;
  }

  /** The root's identity, for a harness or a test, never for a program. */
  public describeRoot(): string {
    return this.store.describe();
  }

  /**
   * Locates a child, keeping a refused parent refused.
   *
   * A refusal is inherited before the child's own reference is even consulted,
   * because attenuation has no meaning below a location that was never reached.
   * Extending a refusal must not launder it into an allowed path.
   */
  private locate(reference: string): Normalization {
    if (!this.location.ok) return this.location;
    const normal = normalizeReference(reference);
    if (!normal.ok) return normal;
    return { ok: true, path: joinNormalized(this.location.path, normal.path) };
  }

  /** The normalized path, or undefined when normalization refused. */
  private contained(): string | undefined {
    return this.location.ok ? this.location.path : undefined;
  }

  private refusal(): Frame {
    const reason = this.location.ok ? "resource-refused" : this.location.reason;
    return this.storeRefusal(reason);
  }

  private storeRefusal(reason: string): Frame {
    return Frame.error(`$!.${reason} ${this.toString()}`);
  }
}
