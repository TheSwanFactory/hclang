#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var execute_1 = require("./execute");
var input = "“Hello, MAML!”";
var argv = process.argv;
if (argv.length > 3) {
    input = argv[3];
}
;
var output = execute_1.execute(input);
console.log(output);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEscUNBQW9DO0FBRXBDLElBQU0sS0FBSyxHQUFHLGdCQUFnQixDQUFDO0FBQy9CLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDMUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUFDLENBQUM7QUFBQSxDQUFDO0FBRTFDLElBQU0sTUFBTSxHQUFHLGlCQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyJ9