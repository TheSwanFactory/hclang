import * as frame from "../frames";

export type LexOptions = { [key: string]: any; };

export type OptionMap = { [key: string]: LexOptions; };

export class FrameStatement extends frame.Frame {

}

export class FrameLazyGroup extends frame.FrameLazy {
  constructor(data: Array<frame.FrameExpr>, meta: frame.Context = frame.NilContext) {
    const group = new frame.FrameGroup(data);
    super([group], meta);
  }
};

export const actions: OptionMap = {
  "\n": {},
  ",": {},
  ";": {wrap: FrameStatement},
};

function addGroup(grouper: typeof frame.FrameGroup) {
  const sample = new grouper([]);
  const open = sample.string_open();
  const close = sample.string_close();
  actions[open] = {push: grouper};
  actions[close] = {pop: grouper};
}

addGroup(frame.FrameGroup);
