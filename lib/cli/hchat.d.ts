#!/usr/bin/env node
import { HC } from "../execute/hc";
export declare class HChat {
    protected hc: HC;
    static readonly IN = "; ";
    static readonly OUT = "# ";
    static iterate(hc: HC): void;
    constructor(hc: HC);
    call(): boolean;
}
