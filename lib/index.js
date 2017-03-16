#!/usr/bin/env node
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var clear = require("clear");
var chalk = require("chalk");
var figlet = require("figlet");
__export(require("./frames"));
__export(require("./maml"));
__export(require("./syntax"));
clear();
console.log(chalk.green(figlet.textSync("MAML", { horizontalLayout: "full" })));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQSxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDN0IsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzdCLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMvQiw4QkFBeUI7QUFDekIsNEJBQXVCO0FBQ3ZCLDhCQUF5QjtBQUV6QixLQUFLLEVBQUUsQ0FBQztBQUNSLE9BQU8sQ0FBQyxHQUFHLENBQ1QsS0FBSyxDQUFDLEtBQUssQ0FDVCxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxDQUFDLENBQ3RELENBQ0YsQ0FBQyJ9