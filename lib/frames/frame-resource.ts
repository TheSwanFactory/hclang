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
 * private: the store and the handler table are TypeScript fields, never
 * metadata, so neither is reachable by property enumeration.
 *
 * Two planes, selected by whether the reference publishes a scheme. The path
 * plane extends the root binding and is bounded by normalization. The scheme
 * plane dispatches to a handler table entry, where an empty slot is the refusal.
 *
 * @module
 */
import { Frame } from "./frame.ts";
import { FrameInt } from "./frame-int.ts";
import { FrameString } from "./frame-string.ts";
import { FrameURI } from "./frame-uri.ts";
import { hasCharacterContent } from "./frame-text.ts";
import type { ResourceBinding } from "./resource-binding.ts";
import { ResourceHandlers, type SchemeHandler } from "./resource-handlers.ts";
import type { ResourceStore } from "./resource-store.ts";
import {
  decomposeReference,
  joinNormalized,
  normalizeReference,
  type ReferenceParts,
} from "./resource-reference.ts";

/** The reference a root binding prints and normalizes as itself. */
const ROOT_REFERENCE = ".";

/**
 * Where a reference landed, decided before any access could happen.
 *
 * A refusal is a placement like the others, because evaluating a resource has to
 * stay inert: the refusal travels with the value and is spelled only when a verb
 * is applied to it.
 */
type Placement =
  | { readonly kind: "path"; readonly path: string }
  | {
    readonly kind: "scheme";
    readonly handler: SchemeHandler;
    readonly parts: ReferenceParts;
  }
  | { readonly kind: "refused"; readonly reason: string };

export class FrameResource extends FrameURI implements ResourceBinding {
  /**
   * Creates the root binding a harness installs.
   *
   * The root is a resource at the empty path, which is what makes extension the
   * only operation and attenuation structural rather than checked: a child is a
   * longer path on the same store, and no path is shorter than the empty one.
   *
   * The handler table defaults to empty, so a harness that installs nothing
   * grants nothing: every scheme is an empty slot until one is bound.
   */
  public static root(
    store: ResourceStore,
    handlers: ResourceHandlers = ResourceHandlers.none,
  ): FrameResource {
    return new FrameResource(ROOT_REFERENCE, store, handlers, {
      kind: "path",
      path: "",
    });
  }

  /**
   * @param reference The reference as written, which stays the printed form.
   * @param store The host seam this resource and its path children share.
   * @param handlers The scheme table this resource dispatches through.
   * @param placement The plane and location decided before this frame existed.
   */
  private constructor(
    reference: string,
    private readonly store: ResourceStore,
    private readonly handlers: ResourceHandlers,
    private readonly placement: Placement,
  ) {
    super(reference);
  }

  /**
   * Extends this binding by one reference.
   *
   * Normalization runs here, before dispatch selects a handler, and it is pure:
   * a refused reference still yields a resource, carrying its refusal. Surfacing
   * the refusal at construction instead would make evaluating
   * `'https://example.com/x'` an error, and a03 requires evaluation to be inert.
   */
  public extend(reference: string): Frame {
    return new FrameResource(
      reference,
      this.store,
      this.handlers,
      this.locate(reference),
    );
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
    const placement = this.placement;
    if (placement.kind === "refused") {
      return this.storeRefusal(placement.reason);
    }

    const content = hasCharacterContent(argument)
      ? argument.characterContent()
      : argument.toString();

    if (placement.kind === "scheme") {
      const written = placement.handler.write(placement.parts, content);
      return written.ok
        ? FrameInt.for(written.count.toString())
        : this.storeRefusal(written.reason);
    }

    const written = this.store.write(placement.path, content);
    return written.ok
      ? FrameInt.for(written.content.length.toString())
      : this.storeRefusal(written.reason);
  }

  /**
   * Reading pushes elements, and for a store the element is the character.
   *
   * No part of the reading is a property of the source: a receiver accepts the
   * characters and decides whether they are whole content, a list, chunks, or HC
   * code. A scheme handler answers its own elements instead, because a handler
   * is not required to be a byte store — a clock knows the instant it read, and
   * spelling it as characters would only make the reader parse it back.
   *
   * A refusal arrives as the single element, so it flows back through the
   * reduce as an ordinary value rather than raising.
   */
  public override elements(): Array<Frame> {
    const placement = this.placement;
    if (placement.kind === "refused") {
      return [this.storeRefusal(placement.reason)];
    }

    if (placement.kind === "scheme") {
      const read = placement.handler.read(placement.parts);
      return read.ok ? [...read.elements] : [this.storeRefusal(read.reason)];
    }

    const read = this.store.read(placement.path);
    if (!read.ok) return [this.storeRefusal(read.reason)];
    return [...read.content].map((char) => new FrameString(char));
  }

  /**
   * A stream iterates content, so its properties are not members.
   *
   * The RFC 3986 components are derived from the reference this value *is*,
   * rather than declared into contents it holds, so a doubled read answers
   * indexed characters and identity metadata never leaks into a content stream.
   * They stay readable by name, where reading one still performs no access.
   */
  public override visibleKeys(): string[] {
    return [];
  }

  /** The root's identity, for a harness or a test, never for a program. */
  public describeRoot(): string {
    return this.store.describe();
  }

  /**
   * The schemes this binding can reach, for a harness or a test.
   *
   * Not reachable from HC. The adapter surface is enumerable so a harness can
   * audit it, and a program that could enumerate it could probe its host.
   */
  public boundSchemes(): readonly string[] {
    return this.handlers.schemes();
  }

  /**
   * Locates a child, keeping a refused parent refused.
   *
   * A refusal is inherited before the child's own reference is even consulted,
   * because attenuation has no meaning below a location that was never reached.
   * Extending a refusal must not launder it into an allowed path.
   *
   * A handler's resource is a leaf: what lies below `'https://host/a'` is the
   * handler's business, not a path this binding may compose, so extending one is
   * refused rather than guessed at.
   */
  private locate(reference: string): Placement {
    if (this.placement.kind === "refused") return this.placement;
    if (this.placement.kind === "scheme") {
      return { kind: "refused", reason: "resource-not-extensible" };
    }

    const parts = decomposeReference(reference);
    if (parts.scheme !== undefined) return this.dispatch(parts);

    const normal = normalizeReference(reference);
    if (!normal.ok) return { kind: "refused", reason: normal.reason };
    return {
      kind: "path",
      path: joinNormalized(this.placement.path, normal.path),
    };
  }

  /**
   * Selects the handler a scheme names, or refuses without a host call.
   *
   * The empty slot is the refusal. Nothing here consults a policy, and nothing
   * reaches a host: an unbound scheme is decided by a table read.
   */
  private dispatch(parts: ReferenceParts): Placement {
    const scheme = parts.scheme ?? "";
    const handler = this.handlers.handler(scheme);
    return handler === undefined
      ? { kind: "refused", reason: "resource-scheme-unbound" }
      : { kind: "scheme", handler, parts };
  }

  private storeRefusal(reason: string): Frame {
    return Frame.error(`$!.${reason} ${this.toString()}`);
  }
}
