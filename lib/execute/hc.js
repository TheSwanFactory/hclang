"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const frames_1 = require("../frames");
const eval_pipe_1 = require("./eval-pipe");
const group_pipe_1 = require("./group-pipe");
const lex_pipe_1 = require("./lex-pipe");
const parse_pipe_1 = require("./parse-pipe");
class HC {
    static make_context(env = {}) {
        const context = {};
        _.each(process.env, (value, key) => {
            context[key] = new frames_1.FrameString(value);
        });
        return context;
    }
    static from_env(env = {}) {
        const context = HC.make_context(env);
        const hc = new HC(context);
        return hc;
    }
    constructor(context = frames_1.NilContext) {
        this.result = new frames_1.FrameArray([], context);
        const evaluator = new eval_pipe_1.EvalPipe(this.result);
        const grouper = new group_pipe_1.GroupPipe(evaluator);
        const parser = new parse_pipe_1.ParsePipe(grouper);
        this.lexer = new lex_pipe_1.LexPipe(parser);
    }
    evaluate(input) {
        const status = this.lexer.lex_string(input);
        return this.result;
    }
}
exports.HC = HC;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9oYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRCQUE0QjtBQUM1QixzQ0FBZ0Y7QUFDaEYsMkNBQXVDO0FBQ3ZDLDZDQUF5QztBQUN6Qyx5Q0FBcUM7QUFDckMsNkNBQXlDO0FBTXpDLE1BQWEsRUFBRTtJQUNOLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBbUIsRUFBRTtRQUM5QyxNQUFNLE9BQU8sR0FBWSxFQUFFLENBQUM7UUFDNUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQ2pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLG9CQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRU0sTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFtQixFQUFFO1FBQzFDLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsTUFBTSxFQUFFLEdBQUcsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0IsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBS0QsWUFBWSxPQUFPLEdBQUcsbUJBQVU7UUFDOUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLG1CQUFVLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzFDLE1BQU0sU0FBUyxHQUFHLElBQUksb0JBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUMsTUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sTUFBTSxHQUFHLElBQUksc0JBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksa0JBQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRU0sUUFBUSxDQUFDLEtBQWE7UUFDM0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3JCLENBQUM7Q0FDRjtBQTlCRCxnQkE4QkMifQ==