#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getopts = require("getopts");
const _ = require("lodash");
const hc_class_1 = require("../execute/hc-class");
const hchat_1 = require("./hchat");
const options = getopts(process.argv.slice(2), {
    alias: {
        evaluate: "e",
        help: "h",
        interactive: "i",
    },
});
const hc = hc_class_1.HC.from_env(process.env);
let evaluated = false;
let output;
if (options.evaluate) {
    output = hc.evaluate(options.evaluate);
    console.log(output.toString());
    evaluated = true;
}
_.each(options._, (file) => {
    output = hc.exec_file(file);
    console.log(output.toString());
    evaluated = true;
});
if (options.interactive || !evaluated) {
    hchat_1.HChat.iterate(hc);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpL2hjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLG1DQUFtQztBQUNuQyw0QkFBNEI7QUFDNUIsa0RBQXlDO0FBRXpDLG1DQUFnQztBQUVoQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFDN0MsS0FBSyxFQUFFO1FBQ0wsUUFBUSxFQUFFLEdBQUc7UUFDYixJQUFJLEVBQUUsR0FBRztRQUNULFdBQVcsRUFBRSxHQUFHO0tBQ2pCO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsTUFBTSxFQUFFLEdBQUcsYUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDcEMsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO0FBQ3RCLElBQUksTUFBYSxDQUFDO0FBRWxCLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRTtJQUNwQixNQUFNLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUMvQixTQUFTLEdBQUcsSUFBSSxDQUFDO0NBQ2xCO0FBRUQsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFHLENBQUMsSUFBSSxFQUFFLEVBQUU7SUFDMUIsTUFBTSxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUMvQixTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDO0FBRUgsSUFBSSxPQUFPLENBQUMsV0FBVyxJQUFJLENBQUMsU0FBUyxFQUFFO0lBQ3JDLGFBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDbkIifQ==