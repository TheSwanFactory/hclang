"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var evaluate_1 = require("./execute/evaluate");
exports.execute = function (input) {
    var result = evaluate_1.evaluate(input);
    var array = result.toStringArray();
    return array.join("\n");
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9leGVjdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0NBQThDO0FBR2pDLFFBQUEsT0FBTyxHQUFHLFVBQUMsS0FBYTtJQUNuQyxJQUFNLE1BQU0sR0FBRyxtQkFBUSxDQUFDLEtBQUssQ0FBZSxDQUFDO0lBQzdDLElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUNyQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMxQixDQUFDLENBQUMifQ==