"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const frames_1 = require("../frames");
const eval_pipe_1 = require("./eval-pipe");
const group_pipe_1 = require("./group-pipe");
const lex_pipe_1 = require("./lex-pipe");
const parse_pipe_1 = require("./parse-pipe");
class HC {
    constructor(env = {}) {
        const context = {};
        _.each(process.env, (value, key) => {
            context[key] = new frames_1.FrameString(value);
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9oYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRCQUE0QjtBQUM1QixzQ0FBZ0Y7QUFDaEYsMkNBQXVDO0FBQ3ZDLDZDQUF5QztBQUN6Qyx5Q0FBcUM7QUFDckMsNkNBQXlDO0FBTXpDLE1BQU0sRUFBRTtJQUlOLFlBQVksTUFBbUIsRUFBRTtRQUMvQixNQUFNLE9BQU8sR0FBWSxFQUFFLENBQUM7UUFDNUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQ2pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLG9CQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksbUJBQVUsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDMUMsTUFBTSxTQUFTLEdBQUcsSUFBSSxvQkFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1QyxNQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekMsTUFBTSxNQUFNLEdBQUcsSUFBSSxzQkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxrQkFBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFTSxRQUFRLENBQUMsS0FBYTtRQUMzQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1QyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDckIsQ0FBQztDQUNGIn0=