import { Frame } from "./frame.ts";
import { type Context, type IKeyValuePair, NilContext } from "./context.ts";
import type { ReceiverState } from "./bound-method.ts";
import { renderNested } from "./stringify.ts";

/**
 * ISourced is a Frame with a source property.
 */
export interface ISourced extends Frame {
  /**
   * source is the source string.
   */
  source: string;
}

/** A logical lookup resolved to its physical declaration key and value. */
export type BindingResolution = {
  key: string;
  value: Frame;
};

/** Visibility levels for logical frame bindings. */
export enum Visibility {
  Public = "public",
  Protected = "protected",
  Private = "private",
}

/**
 * MetaFrame is the parent class of Frame, providing methods for managing metadata.
 */
export class MetaFrame {
  /**
   * Checks if the given string is numeric
   * (to distinguish array indices from metadata keys)
   *
   * @param {string} value - The string to check.
   * @returns {boolean} `true` if the string is all numeric, `false` otherwise.
   */
  public static isInteger(value: string): boolean {
    return /^\p{N}+$/u.test(value);
  }

  /**
   * Checks if the given character is alphabetic.
   *
   * @param {string} char - The character to check.
   * @returns {boolean} `true` if the character is alphabetic, `false` otherwise.
   */
  public static isAlphabetic(char: string): boolean {
    return /\p{L}/u.test(char);
  }

  /**
   * id_count is a static counter, incremented to generate unique IDs.
   */
  public static id_count = 0;

  /**
   * up is the lexical parent: the scope or container a frame was evaluated in.
   * It is rewritten as lookup learns context and carries no ownership claim.
   */
  public up: Frame = {} as Frame; // forward-declare Frame

  /**
   * parent is the declared parent: the explicit `.^` inheritance link.
   * It is written only by setParent, so the declared chain is acyclic by
   * construction, and it is the only chain visibility authorizes against.
   */
  public parent: Frame = {} as Frame; // forward-declare Frame

  /** Typed receiver capability installed only on an invocation frame. */
  public receiverState?: ReceiverState;

  /**
   * declares marks a frame that accepts declarations, so a name binds to the
   * innermost marked target instead of inferring one from context classes.
   */
  public declares = false;

  /**
   * id is a unique identifier for each Frame.
   */
  public id: string;

  /**
   * meta is a map of key-value pairs for the Frame.
   * _isNil is a flag indicating if the Frame is nil.
   */
  constructor(public meta: Context = NilContext, _isNil = false) {
    const name = this.constructor.name;
    const id = name + "." + MetaFrame.id_count++;
    this.id = "$:" + id;
  }

  /**
   * get_here retrieves a Frame by key from the current context.
   */
  public get_here(key: string, _origin: MetaFrame = this): Frame {
    const exact = this.resolve_here(key, _origin);
    if (exact != null) {
      return exact.value;
    }
    return this.match_here(key);
  }

  /** Resolves a logical name to the declaration key visible from origin. */
  public resolve_here(
    key: string,
    origin: MetaFrame = this,
  ): BindingResolution | undefined {
    if (key.startsWith("__")) {
      return this.authorize(
        key,
        Visibility.Private,
        key.slice(2),
        origin,
      );
    }
    if (key.startsWith("_")) {
      return this.authorize(
        key,
        Visibility.Protected,
        key.slice(1),
        origin,
      );
    }

    const publicValue = this.meta[key];
    if (publicValue != null) return { key, value: publicValue };
    return this.authorize(
      `_${key}`,
      Visibility.Protected,
      key,
      origin,
    ) ??
      this.authorize(
        `__${key}`,
        Visibility.Private,
        key,
        origin,
      );
  }

  /**
   * Get a frame by key through one guarded lookup traversal.
   *
   * Subclasses customize only local lookup, links, and successful-result
   * transformation. The traversal itself stays here so a virtual override
   * cannot accidentally discard cycle state. Declared parents precede lexical
   * scope, and globals are consulted once after the complete scope graph.
   */
  public get(key: string, origin: MetaFrame = this): Frame {
    const local = this.lookup_here(key, origin);
    if (!local.is.missing) {
      return this.lookup_result(local, key);
    }

    // Allocate traversal state only after an immediate local miss.
    const seen = new Set<MetaFrame>([this]);
    for (const link of this.lookup_links()) {
      const result = MetaFrame.lookup(link, key, origin, seen);
      if (!result.is.missing) {
        return this.lookup_result(result, key);
      }
    }

    // Globals are the final lookup tier, even when the lexical graph cycles.
    const globals = Frame.globals;
    if (globals && !globals.is.missing && !seen.has(globals)) {
      const result = MetaFrame.lookup(globals, key, origin, seen);
      if (!result.is.missing) {
        return this.lookup_result(result, key);
      }
    }
    return Frame.missing;
  }

  /** Local behavior used by the guarded lookup driver. */
  protected lookup_here(key: string, origin: MetaFrame): Frame {
    return this.get_here(key, origin);
  }

  /** Non-global links in lookup precedence order. */
  protected lookup_links(): Frame[] {
    const links: Frame[] = [];
    if (this.parent && !this.parent.is.missing) {
      links.push(this.parent);
    }
    if (
      this.up && !this.up.is.missing && this.up !== Frame.globals
    ) {
      links.push(this.up);
    }
    return links;
  }

  /** Allows wrappers to transform a value found anywhere below them. */
  protected lookup_result(result: Frame, _key: string): Frame {
    return result;
  }

  /** Depth-first declared-before-lexical traversal without global fallback. */
  private static lookup(
    frame: MetaFrame,
    key: string,
    origin: MetaFrame,
    seen: Set<MetaFrame>,
  ): Frame {
    if (seen.has(frame)) {
      return Frame.missing;
    }
    seen.add(frame);

    const local = frame.lookup_here(key, origin);
    if (!local.is.missing) {
      return frame.lookup_result(local, key);
    }
    for (const link of frame.lookup_links()) {
      const result = MetaFrame.lookup(link, key, origin, seen);
      if (!result.is.missing) {
        return frame.lookup_result(result, key);
      }
    }
    return Frame.missing;
  }

  /**
   * set adds a new key-value pair to the current context.
   */
  public set(key: string, value: Frame): MetaFrame {
    if (this.meta === NilContext) {
      this.meta = {};
    }
    this.meta[key] = value;
    return this;
  }

  /** Whether this frame carries an explicitly declared parent. */
  public hasDeclaredParent(): boolean {
    return this.parent != null && !this.parent.is.missing;
  }

  /**
   * setParent is the only path that may attach a declared parent, so a cyclic
   * declared chain cannot be built by a caller that forgot to check. It returns
   * an error frame when the link is refused and undefined when it is accepted.
   */
  public setParent(parent: Frame): Frame | undefined {
    if (this.wouldCreateParentCycle(parent)) {
      return Frame.error("$!.cyclic-parent .^");
    }
    this.parent = parent;
    return undefined;
  }

  /** Whether assigning parent would attach this frame to a cyclic chain. */
  public wouldCreateParentCycle(parent: Frame): boolean {
    const seen = new Set<MetaFrame>([this]);
    let current: Frame | undefined = parent;
    while (current && !current.is.missing) {
      if (seen.has(current)) return true;
      seen.add(current);
      current = current.parent;
    }
    return false;
  }

  /**
   * meta_copy creates a shallow copy of the current context.
   */
  public meta_copy(): Context {
    return { ...this.meta };
  }

  /**
   * meta_keys returns an array of keys in the current context.
   */
  public meta_keys(): string[] {
    return Object.keys(this.meta);
  }

  /**
   * meta_length returns the number of keys in the current context.
   */
  public meta_length(): number {
    return this.meta_keys().length;
  }

  /**
   * meta_pairs returns an array of key-value pairs in the current context.
   */
  public meta_pairs(): Array<IKeyValuePair> {
    return Object.entries(this.meta);
  }

  /**
   * meta_string returns a string representation of the current context.
   *
   * Nested values render through the cycle guard, so metadata that reaches this
   * frame again yields an id rather than overflowing the host stack.
   */
  public meta_string(): string {
    return this.meta_pairs().map(([key, value]) => {
      if (key === Frame.kOUT) {
        return `.${key} ${value.id};`;
      }
      return `.${key} ${renderNested(value, () => value.toString())};`;
    }).join(" ");
  }

  /**
   * match_here checks if a target string matches any key in the current context.
   */
  protected match_here(target: string): Frame {
    let result = Frame.missing;
    this.meta_pairs().forEach(([key, value]) => {
      const isPattern = key.match(/\/(.*)\//);
      if (isPattern) {
        const pattern = new RegExp(isPattern[1]);
        if (pattern.test(target)) {
          result = value;
          if ("source" in result) {
            const sourced = result as ISourced;
            sourced.source = target;
          }
        }
      }
    });
    return result;
  }

  private authorize(
    physicalKey: string,
    visibility: Visibility,
    key: string,
    origin: MetaFrame,
  ): BindingResolution | undefined {
    const value = this.meta[physicalKey];
    if (value == null) return undefined;
    const authorized = visibility === Visibility.Public ||
      (visibility === Visibility.Private
        ? origin === this
        : this.isAncestorOf(origin));
    if (authorized) {
      return { key: physicalKey, value };
    }
    return {
      key: physicalKey,
      value: Frame.error(`$!.is-${visibility} .${key}`),
    };
  }

  /**
   * isAncestorOf walks the declared parent chain only. Lexical nesting and
   * syntactic containment confer no protected access: an inner aggregate or an
   * unrelated peer's method is not a descendant.
   */
  private isAncestorOf(origin: MetaFrame): boolean {
    const seen = new Set<MetaFrame>();
    let current: MetaFrame | undefined = origin;
    while (current && !seen.has(current)) {
      if (current === this) return true;
      seen.add(current);
      if (!current.hasDeclaredParent()) return false;
      current = current.parent;
    }
    return false;
  }
}
