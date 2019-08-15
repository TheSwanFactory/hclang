"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const evaluate_1 = require("./execute/evaluate");
exports.execute = (input) => {
    const result = evaluate_1.evaluate(input);
    const array = result.toStringArray();
    return array.join("\n");
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9leGVjdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaURBQThDO0FBR2pDLFFBQUEsT0FBTyxHQUFHLENBQUMsS0FBYSxFQUFFLEVBQUU7SUFDdkMsTUFBTSxNQUFNLEdBQUcsbUJBQVEsQ0FBQyxLQUFLLENBQWUsQ0FBQztJQUM3QyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDckMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDMUIsQ0FBQyxDQUFDIn0=