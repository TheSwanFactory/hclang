import { Frame, FrameString } from "../frames";

export const pipeline = (output: FrameString, char: string): Frame => {
  const frameChar = new FrameString(char);
  const result = output.call(frameChar);
  console.log(`pipeline ${result} for ${frameChar}`);
  return result;
};
