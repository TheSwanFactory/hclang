#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const getopts = require("getopts");
const execute_1 = require("../execute");
let input = null;
const options = getopts(process.argv.slice(2), {
    alias: {
        eval: "e",
        help: "h",
        interactive: "i",
    },
});
const files = options._;
if (files.length > 1) {
    input = fs.readFileSync(files[0], "utf8");
}
else if (options.eval) {
    input = options.eval;
}
else {
    options.interactive = true;
}
;
if (input) {
    const output = execute_1.execute(input);
    console.log(output);
}
if (options.interactive) {
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpL2hjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLHlCQUF5QjtBQUN6QixtQ0FBbUM7QUFDbkMsd0NBQXFDO0FBRXJDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQztBQUVqQixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFDN0MsS0FBSyxFQUFFO1FBQ0wsSUFBSSxFQUFFLEdBQUc7UUFDVCxJQUFJLEVBQUUsR0FBRztRQUNULFdBQVcsRUFBRSxHQUFHO0tBQ2pCO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUN4QixJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLEtBQUssR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztDQUMzQztLQUFNLElBQUksT0FBTyxDQUFDLElBQUksRUFBRTtJQUN2QixLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztDQUN0QjtLQUFNO0lBQ0wsT0FBTyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7Q0FDNUI7QUFBQSxDQUFDO0FBRUYsSUFBSSxLQUFLLEVBQUU7SUFDVCxNQUFNLE1BQU0sR0FBRyxpQkFBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Q0FDckI7QUFFRCxJQUFJLE9BQU8sQ0FBQyxXQUFXLEVBQUU7Q0FFeEIifQ==