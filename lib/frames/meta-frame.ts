import { Frame } from "./frame.ts";
import { type Context, type IKeyValuePair, NilContext } from "./context.ts";

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

  /**
   * receiver is the frame a method body executes against, installed per call
   * on the invocation frame rather than by mutating a shared closure.
   */
  public receiver: Frame = {} as Frame; // forward-declare Frame

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
   * get retrieves a Frame by key, searching up the parent chain if necessary.
   */

  public get(key: string, origin: MetaFrame = this): Frame {
    const result = this.get_here(key, origin);
    if (!result.is.missing) {
      return result;
    }

    // The declared chain is consulted before the lexical one: inheritance is
    // ownership, while up is only the scope this frame happened to be seen in.
    const declared = this.parent;
    if (declared && !declared.is.missing) {
      const inherited = declared.get(key, origin);
      if (!inherited.is.missing) {
        return inherited;
      }
    }

    let parent = this.up || Frame.globals;
    if (parent.is.missing) {
      if (Frame.globals.is.missing) {
        return Frame.missing;
      }
      parent = Frame.globals;
    }
    return parent.get(key, origin);
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
   * The innermost receiver active across an evaluation context stack.
   *
   * Only a frame's own receiver slot counts. The lexical `up` chain is not
   * followed: it is rewritten by unrelated evaluation, including on every
   * successful lookup and on the shared body items an invocation frame wraps,
   * so walking it would let one call's receiver leak into another's. A scope
   * nested inside a method body still finds the receiver because the
   * invocation frame that carries it stays on this stack.
   */
  public static receiverIn(contexts: Frame[]): Frame | undefined {
    for (let i = contexts.length - 1; i >= 0; i--) {
      const receiver = contexts[i].receiver;
      if (receiver && !receiver.is.missing) {
        return receiver;
      }
    }
    return undefined;
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
   */
  public meta_string(): string {
    return this.meta_pairs().map(([key, value]) => {
      if (key === Frame.kOUT) {
        return `.${key} ${value.id};`;
      } else {
        return `.${key} ${value};`;
      }
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
