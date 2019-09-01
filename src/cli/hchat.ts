#!/usr/bin/env node
import * as prompt_sync from "prompt-sync";
import * as prompt_history from "prompt-sync-history";
import { HCLang } from "../execute/hc-lang";
import { Frame } from "../frames";
import { version } from "../version";

const prompt = prompt_sync({
  history: prompt_history(),
});

export class HChat {
  public static readonly IN = "; ";
  public static readonly OUT = "# ";

  public static iterate(hc: HCLang): boolean {
    console.log(".hc " + version);
    const hchat = new HChat(hc);
    return hchat.call();
  }

  constructor(protected hc: HCLang) {
  }

  public call(): boolean {
    let status = true;
    while (status) {
      const input = prompt(HChat.IN);
      if (!input) {
        status = false;
        break;
      }
      const output = this.hc.evaluate(input);
      const debug = this.hc.get("DEBUG");
      if (debug !== Frame.missing) {
        console.log(output);
      }
      console.log(HChat.OUT + output);
    }
    return status;
  }
}
