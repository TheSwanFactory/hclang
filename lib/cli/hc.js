#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const getopts = require("getopts");
const execute_1 = require("../execute");
let input = "“Hello, MAML!”";
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
const output = execute_1.execute(input);
console.log(output);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpL2hjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLHlCQUF5QjtBQUN6QixtQ0FBbUM7QUFDbkMsd0NBQXFDO0FBRXJDLElBQUksS0FBSyxHQUFHLGdCQUFnQixDQUFDO0FBRTdCLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtJQUM3QyxLQUFLLEVBQUU7UUFDTCxJQUFJLEVBQUUsR0FBRztRQUNULElBQUksRUFBRSxHQUFHO1FBQ1QsV0FBVyxFQUFFLEdBQUc7S0FDakI7Q0FDRixDQUFDLENBQUM7QUFFSCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3hCLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7SUFDcEIsS0FBSyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0NBQzNDO0tBQU0sSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFO0lBQ3ZCLEtBQUssR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO0NBQ3RCO0tBQU07SUFDTCxPQUFPLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztDQUM1QjtBQUFBLENBQUM7QUFFRixNQUFNLE1BQU0sR0FBRyxpQkFBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMifQ==