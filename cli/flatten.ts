import { Frame, FrameArray } from "../lib/frames.ts";

/**
 * Flatten Frame object graphs into a tree structure.
 *
 * Represents a flattened structure of a hierarchical data model.
 * Each node in the structure has a unique ID, a display name, a parent node ID, and a list of child node IDs.
 * Nodes can be lazily loaded from a `FrameArray`.
 */
export class Flatten {
  /**
   * Unique keyPath.
   */
  id: string;

  /**
   * Display name.
   */
  name: string;

  /**
   * Stores only child IDs (lazy loading).
   */
  children: string[];

  /**
   * Set only if a FrameArray.
   */
  private array: FrameArray | null;

  /**
   * A map to store all nodes by their unique IDs.
   */
  private static nodeMap: Map<string, Flatten> = new Map();

  /**
   * Retrieves a node by its unique ID.
   * If the node is not found in the map, it attempts to load it from its parent node.
   *
   * @param id - The unique ID of the node.
   * @returns The node if found, otherwise undefined.
   */
  public static getNode(id: string): Flatten | undefined {
    let result = Flatten.nodeMap.get(id);
    if (result) {
      return result;
    }

    const ids = id.split(".");
    const key = ids.pop()!;
    const parentKey = ids.join(".");

    if (!parentKey) {
      return undefined;
    }

    const parent = Flatten.getNode(parentKey);
    if (!parent) {
      return undefined;
    }

    const child = Frame.isInteger(key) && parent.array
      ? parent.array.get(key)
      : parent.frame.get(key);

    if (child) {
      result = new Flatten(child, key, parentKey);
      return result;
    }
    return undefined;
  }

  /**
   * Constructs a new Flatten node.
   *
   * @param frame - The frame data associated with the node.
   * @param key - The key of the node.
   * @param parent - The key of the parent node (null for root).
   */
  constructor(
    private frame: Frame,
    key: string,
    public parent: string | null = null,
  ) {
    this.array = frame instanceof FrameArray ? frame : null;
    this.name = frame instanceof FrameArray ? key : frame.toString();
    this.id = parent ? `${parent}.${key}` : key;
    Flatten.nodeMap.set(this.id, this);

    let keys = frame.meta_keys();
    if (this.array) {
      keys = keys.concat(
        Array.from({ length: this.array.size() }, (_, i) => `${i}`),
      );
    }
    this.children = keys.map((childKey) => `${this.id}.${childKey}`);
  }
  /**
   * Returns a string representation of the Flatten node.
   *
   * @returns A string representing the Flatten node.
   */
  public toString(): string {
    return `Flatten<${this.id} ${this.name}>`;
  }

  /**
   * toJson converts the Flatten node to a JSON object.
   *
   * @returns A JSON object representing the Flatten node.
   */
  public toJson(): object {
    return {
      name: this.name,
      children: this.children,
      id: this.id,
      parent: this.parent,
    };
  }
}
