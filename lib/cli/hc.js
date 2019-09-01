#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getopts = require("getopts");
const _ = require("lodash");
const hc_lang_1 = require("../execute/hc-lang");
const hchat_1 = require("./hchat");
const options = getopts(process.argv.slice(2), {
    alias: {
        evaluate: "e",
        help: "h",
        interactive: "i",
    },
});
const hclang = new hc_lang_1.HCLang(process.env);
let evaluated = false;
let output;
if (options.evaluate) {
    output = hclang.evaluate(options.evaluate);
    console.log(output.toString());
    evaluated = true;
}
_.each(options._, (file) => {
    output = hclang.exec_file(file);
    console.log(output.toString());
    evaluated = true;
});
if (options.interactive || !evaluated) {
    hchat_1.HChat.iterate(hclang);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpL2hjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLG1DQUFtQztBQUNuQyw0QkFBNEI7QUFDNUIsZ0RBQTRDO0FBRTVDLG1DQUFnQztBQUVoQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFDN0MsS0FBSyxFQUFFO1FBQ0wsUUFBUSxFQUFFLEdBQUc7UUFDYixJQUFJLEVBQUUsR0FBRztRQUNULFdBQVcsRUFBRSxHQUFHO0tBQ2pCO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsTUFBTSxNQUFNLEdBQUcsSUFBSSxnQkFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN2QyxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFDdEIsSUFBSSxNQUFhLENBQUM7QUFFbEIsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO0lBQ3BCLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMzQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLFNBQVMsR0FBRyxJQUFJLENBQUM7Q0FDbEI7QUFFRCxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRTtJQUMxQixNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLFNBQVMsR0FBRyxJQUFJLENBQUM7QUFDbkIsQ0FBQyxDQUFDLENBQUM7QUFFSCxJQUFJLE9BQU8sQ0FBQyxXQUFXLElBQUksQ0FBQyxTQUFTLEVBQUU7SUFDckMsYUFBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztDQUN2QiJ9