// import * as fs from "fs";
import { Context, Frame, FrameGroup, FrameString, NilContext } from "../frames";

export class HCTest extends Frame {

  constructor(protected out: Frame) {
    super(NilContext);
  } 
}
