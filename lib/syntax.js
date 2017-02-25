"use strict";
var evaluate_1 = require("./syntax/evaluate");
exports.exec = function (input) {
    var result = evaluate_1.evaluate(input);
    var array = result.toStringArray();
    return array.join("\n");
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3N5bnRheC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsOENBQTZDO0FBR2hDLFFBQUEsSUFBSSxHQUFHLFVBQUMsS0FBYTtJQUNoQyxJQUFNLE1BQU0sR0FBRyxtQkFBUSxDQUFDLEtBQUssQ0FBZSxDQUFDO0lBQzdDLElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUNyQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMxQixDQUFDLENBQUMifQ==