#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prompter = require("prompt-sync");
const prompt_history = require("prompt-sync-history");
const prompt = prompter({
    history: prompt_history(),
});
const name = prompt("enter name: ", "Ernie");
console.log("name " + name);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jbGkvcmVwbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSx3Q0FBd0M7QUFDeEMsc0RBQXNEO0FBRXRELE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQztJQUN0QixPQUFPLEVBQUUsY0FBYyxFQUFFO0NBQzFCLENBQUMsQ0FBQztBQUVILE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMifQ==