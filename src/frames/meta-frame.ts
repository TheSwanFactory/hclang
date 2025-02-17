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

/**
 * MetaFrame is the parent class of Frame, providing methods for managing metadata.
 */
export class MetaFrame {
  /**
   * id_count is a static counter, incremented to generate unique IDs.
   */
  public static id_count = 0;
  
  /**
   * up is a reference to the parent frame.
   */
  public up: Frame = {} as Frame; // forward-declare Frame

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
    const exact = this.meta[key];
    if (exact != null) {
      return exact;
    }
    return this.match_here(key);
  }

  /** 
   * get retrieves a Frame by key, searching up the parent chain if necessary.
  */

  public get(key: string, origin: MetaFrame = this): Frame {
    const result = this.get_here(key, origin);
    if (!result.is.missing) {
      return result;
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
}
