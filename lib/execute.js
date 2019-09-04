"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const evaluate_1 = require("./execute/evaluate");
const stripLastCommas = (array) => {
    const result = array.map((item) => {
        const n = item.length - 1;
        if (item[n] === ",") {
            return item.substring(0, n);
        }
        return item;
    });
    return result;
};
exports.execute = (input) => {
    const result = evaluate_1.evaluate(input);
    const array = result.toStringArray();
    const stripped = stripLastCommas(array);
    return stripped.join("\n");
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9leGVjdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaURBQThDO0FBRzlDLE1BQU0sZUFBZSxHQUFHLENBQUMsS0FBb0IsRUFBRSxFQUFFO0lBQy9DLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUNqQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUMxQixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7WUFDbkIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUM3QjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDLENBQUM7QUFFVyxRQUFBLE9BQU8sR0FBRyxDQUFDLEtBQWEsRUFBRSxFQUFFO0lBQ3ZDLE1BQU0sTUFBTSxHQUFHLG1CQUFRLENBQUMsS0FBSyxDQUFlLENBQUM7SUFDN0MsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3JDLE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN4QyxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0IsQ0FBQyxDQUFDIn0=