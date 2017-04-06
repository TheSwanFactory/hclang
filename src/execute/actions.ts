import { Context, Frame, FrameGroup, FrameString, NilContext } from "../frames";

export type LexOptions = { [key: string]: any; };

export type OptionMap = { [key: string]: LexOptions; };

export class FrameStatement extends Frame {

}

export const actions: OptionMap = {
  "\n": {},
  ",": {},
  ";": {wrap: FrameStatement},
};

function addGroup(grouper: typeof FrameGroup) {
  const sample = new grouper([]);
  const open = sample.string_open();
  const close = sample.string_close();
  actions[open] = {push: grouper};
  actions[close] = {pop: grouper};
}

addGroup(FrameGroup);
