import { Frame } from "./frame";

export type Context = { [key: string]: Frame; };
export const NilContext: Context = {};

export class MetaFrame {
  constructor(protected meta = NilContext, isNil = false) {
  }
}
