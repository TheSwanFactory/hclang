import { Frame, FrameArray } from "../frames.ts";

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
   * Parent node ID (null for root).
   */
  parent: string | null;

  /**
   * Stores only child IDs (lazy loading).
   */
  children: string[];

  /**
   * Always set.
   */
  private frame: Frame;

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

    let child = undefined;
    if (Frame.isInteger(key) && parent.array) {
      child = parent.array.get(key);
    } else {
      child = parent.frame.get(key);
    }

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
   * @param parentKey - The key of the parent node (null for root).
   */
  constructor(frame: Frame, key: string, parentKey: string | null = null) {
    this.frame = frame;
    this.array = null;
    this.name = key;
    this.parent = parentKey;
    this.id = parentKey ? `${parentKey}.${key}` : key;
    Flatten.nodeMap.set(this.id, this);

    let keys = frame.meta_keys();

    if (frame instanceof FrameArray) {
      this.array = frame;
      const n = this.array.size();
      keys = keys.concat(Array.from({ length: n }, (_, i) => `${i}`));
    } else {
      this.name = frame.toString();
    }
    this.children = keys.map((key) => `${this.id}.${key}`);
  }

  /**
   * Returns a string representation of the Flatten node.
   *
   * @returns A string representing the Flatten node.
   */
  public toString(): string {
    return `Flatten<${this.id} ${this.name}>`;
  }
}
