"use strict";
var evaluate_1 = require("./syntax/evaluate");
exports.execute = function (input) {
    var result = evaluate_1.evaluate(input);
    var array = result.toStringArray();
    return array.join("\n");
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9leGVjdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSw4Q0FBNkM7QUFFaEMsUUFBQSxPQUFPLEdBQUcsVUFBQyxLQUFhO0lBQ25DLElBQU0sTUFBTSxHQUFHLG1CQUFRLENBQUMsS0FBSyxDQUFlLENBQUM7SUFDN0MsSUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3JDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFCLENBQUMsQ0FBQyJ9