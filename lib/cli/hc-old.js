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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtb2xkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NsaS9oYy1vbGQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsbUNBQW1DO0FBQ25DLDRCQUE0QjtBQUM1QixnREFBNEM7QUFFNUMsbUNBQWdDO0FBRWhDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtJQUM3QyxLQUFLLEVBQUU7UUFDTCxRQUFRLEVBQUUsR0FBRztRQUNiLElBQUksRUFBRSxHQUFHO1FBQ1QsV0FBVyxFQUFFLEdBQUc7S0FDakI7Q0FDRixDQUFDLENBQUM7QUFFSCxNQUFNLE1BQU0sR0FBRyxJQUFJLGdCQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZDLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztBQUN0QixJQUFJLE1BQWEsQ0FBQztBQUVsQixJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUU7SUFDcEIsTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzNDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDL0IsU0FBUyxHQUFHLElBQUksQ0FBQztDQUNsQjtBQUVELENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRyxDQUFDLElBQUksRUFBRSxFQUFFO0lBQzFCLE1BQU0sR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDL0IsU0FBUyxHQUFHLElBQUksQ0FBQztBQUNuQixDQUFDLENBQUMsQ0FBQztBQUVILElBQUksT0FBTyxDQUFDLFdBQVcsSUFBSSxDQUFDLFNBQVMsRUFBRTtJQUNyQyxhQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0NBQ3ZCIn0=