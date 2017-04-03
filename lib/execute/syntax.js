"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var terminals_1 = require("./terminals");
var tokens_1 = require("./tokens");
var meta = _.clone(tokens_1.tokens);
_.merge(meta, terminals_1.terminals);
exports.syntax = meta;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvc3ludGF4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMEJBQTRCO0FBRTVCLHlDQUFrRDtBQUNsRCxtQ0FBa0M7QUFFbEMsSUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFNLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxxQkFBUyxDQUFDLENBQUM7QUFFWixRQUFBLE1BQU0sR0FBRyxJQUFJLENBQUMifQ==