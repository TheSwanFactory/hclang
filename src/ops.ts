import { Frame } from "./frames";

export interface ICurryFunction extends Function {
  (source: Frame, block: Frame): Frame;
}

export const Curry = (func: ICurryFunction, source: Frame) => {
  return (block: Frame) => {
    return func(source, block);
  };
};

export { MetaMap } from "./ops/iterators";
