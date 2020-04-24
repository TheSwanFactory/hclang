"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const evaluate_1 = require("./execute/evaluate");
const stripLastCommas = (array) => {
    const result = array.map((item) => {
        const n = item.length - 1;
        if (item[n] === ',') {
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
    return stripped.join('\n');
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9leGVjdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaURBQTZDO0FBRzdDLE1BQU0sZUFBZSxHQUFHLENBQUMsS0FBb0IsRUFBRSxFQUFFO0lBQy9DLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUNoQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQTtRQUN6QixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7WUFDbkIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtTQUM1QjtRQUNELE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQyxDQUFDLENBQUE7SUFDRixPQUFPLE1BQU0sQ0FBQTtBQUNmLENBQUMsQ0FBQTtBQUVZLFFBQUEsT0FBTyxHQUFHLENBQUMsS0FBYSxFQUFFLEVBQUU7SUFDdkMsTUFBTSxNQUFNLEdBQUcsbUJBQVEsQ0FBQyxLQUFLLENBQWUsQ0FBQTtJQUM1QyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUE7SUFDcEMsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ3ZDLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUM1QixDQUFDLENBQUEifQ==