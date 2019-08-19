#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getopts = require("getopts");
const _ = require("lodash");
const hc_1 = require("../execute/hc");
const hchat_1 = require("./hchat");
const options = getopts(process.argv.slice(2), {
    alias: {
        evaluate: "e",
        help: "h",
        interactive: "i",
    },
});
const hc = new hc_1.HC();
let evaluated = false;
let output;
if (options.evaluate) {
    output = hc.evaluate(options.evaluate);
    console.log(output);
    evaluated = true;
}
_.each(options._, (file) => {
    output = hc.exec_file(file);
    console.log(output);
    evaluated = true;
});
if (options.interactive || !evaluated) {
    const status = hchat_1.HChat.iterate(hc);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpL2hjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLG1DQUFtQztBQUNuQyw0QkFBNEI7QUFFNUIsc0NBQW1DO0FBRW5DLG1DQUFnQztBQUVoQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFDN0MsS0FBSyxFQUFFO1FBQ0wsUUFBUSxFQUFFLEdBQUc7UUFDYixJQUFJLEVBQUUsR0FBRztRQUNULFdBQVcsRUFBRSxHQUFHO0tBQ2pCO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsTUFBTSxFQUFFLEdBQUcsSUFBSSxPQUFFLEVBQUUsQ0FBQztBQUNwQixJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFDdEIsSUFBSSxNQUFhLENBQUM7QUFFbEIsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO0lBQ3BCLE1BQU0sR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3BCLFNBQVMsR0FBRyxJQUFJLENBQUM7Q0FDbEI7QUFFRCxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRTtJQUMxQixNQUFNLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3BCLFNBQVMsR0FBRyxJQUFJLENBQUM7QUFDbkIsQ0FBQyxDQUFDLENBQUM7QUFFSCxJQUFJLE9BQU8sQ0FBQyxXQUFXLElBQUksQ0FBQyxTQUFTLEVBQUU7SUFDckMsTUFBTSxNQUFNLEdBQUcsYUFBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztDQUNsQyJ9