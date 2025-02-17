import { type Frame, FrameArray } from "../frames.ts";

export class Flatten {
  private array: FrameArray | null; // set only if a FrameArray
  id: string; // Unique keyPath
  name: string; // Display name
  parent: string | null; // Parent node ID (null for root)
  children: string[]; // Stores only child IDs (lazy loading)
  private static nodeMap: Map<string, Flatten> = new Map();

  public static getNode(id: string): Flatten | undefined {
    const result = Flatten.nodeMap.get(id);
    if (result) {
      return result;
    }
    const [parentKey, key] = id.split(".").reverse();
    console.log(`parentKey: ${parentKey}, name: ${key}`);
    const parent = Flatten.getNode(parentKey);
    const child = parent?.array?.get(key);
    if (child) {
      const node = new Flatten(child, key, parentKey);
      return node;
    } else {
      return undefined;
    }
  }

  constructor(frame: Frame, key: string, parentKey: string | null = null) {
    this.array = null;
    this.name = key;
    this.parent = parentKey;
    this.id = parentKey ? `${parentKey}.${key}` : key;
    Flatten.nodeMap.set(this.id, this);

    this.children = [];
    if (frame instanceof FrameArray) {
      this.array = frame;
      const n = this.array.size();
      this.children = Array.from({ length: n }, (_, i) => `${this.id}.${i}`);
    } else {
      this.name = frame.toString();
    }
  }
}
