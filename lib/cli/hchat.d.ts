#!/usr/bin/env node
import { HCLang } from "../execute/hc-lang";
export declare class HChat {
    protected hc: HCLang;
    static readonly IN = "; ";
    static readonly OUT = "# ";
    static iterate(hc: HCLang): boolean;
    constructor(hc: HCLang);
    call(): boolean;
}
