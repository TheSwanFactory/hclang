#!/usr/bin/env node
import * as prompt_sync from "prompt-sync";
import * as prompt_history from "prompt-sync-history";
import { HC } from "../execute/hc";
import { Context, Frame, NilContext } from "../frames";
import { version } from "../version";

const prompt = prompt_sync({
  history: prompt_history(),
});

export class HChat {
  public static readonly IN = "; ";
  public static readonly OUT = "# ";

  public static iterate(hc: HC): boolean {
    console.log(".hc " + version);
    const hchat = new HChat(hc);
    return hchat.call();
  }

  constructor(protected hc: HC) {
  }

  public call(): boolean {
    let status = true;
    while (status) {
      const input = prompt(HChat.IN);
      const output = this.hc.evaluate(input);
      console.log(HChat.OUT + output);
      status = true;
    }
    return true;
  }
}
