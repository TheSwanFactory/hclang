"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const syntax_1 = require("./syntax");
class LexTerminal extends frames_1.Frame {
    constructor(options) {
        super(frames_1.NilContext);
        this.options = options;
        this.callme = true;
    }
    apply(argument, parameter) {
        const source = argument;
        const options = parameter;
        return source.finish(options);
    }
}
class Lexer extends frames_1.Frame {
    constructor(out) {
        syntax_1.syntax[Lexer.kOUT] = out;
        super(syntax_1.syntax);
    }
    lex_string(input) {
        const source = new frames_1.FrameString(input);
        return this.lex(source);
    }
    lex(source) {
        return source.reduce(this);
    }
    fold(argument) {
        const out = this.get(frames_1.Frame.kOUT);
        this.set(frames_1.Frame.kOUT, out.call(argument));
    }
    finish(options) {
        return frames_1.Frame.nil;
    }
}
exports.Lexer = Lexer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXhlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHNDQUFnRjtBQUdoRixxQ0FBa0M7QUFFbEMsaUJBQWtCLFNBQVEsY0FBSztJQUM3QixZQUFzQixPQUFtQjtRQUN2QyxLQUFLLENBQUMsbUJBQVUsQ0FBQyxDQUFDO1FBREUsWUFBTyxHQUFQLE9BQU8sQ0FBWTtRQUV2QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztJQUNyQixDQUFDO0lBRU0sS0FBSyxDQUFDLFFBQWUsRUFBRSxTQUFnQjtRQUM1QyxNQUFNLE1BQU0sR0FBRyxRQUFpQixDQUFDO1FBQ2pDLE1BQU0sT0FBTyxHQUFHLFNBQXVCLENBQUM7UUFDeEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDaEMsQ0FBQztDQUNGO0FBRUQsV0FBbUIsU0FBUSxjQUFLO0lBQzlCLFlBQVksR0FBVTtRQUNwQixlQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUN6QixLQUFLLENBQUMsZUFBTSxDQUFDLENBQUM7SUFDaEIsQ0FBQztJQUVNLFVBQVUsQ0FBQyxLQUFhO1FBQzdCLE1BQU0sTUFBTSxHQUFHLElBQUksb0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBRU0sR0FBRyxDQUFDLE1BQW1CO1FBQzVCLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFTSxJQUFJLENBQUMsUUFBZTtRQUN6QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFTSxNQUFNLENBQUMsT0FBbUI7UUFDL0IsTUFBTSxDQUFDLGNBQUssQ0FBQyxHQUFHLENBQUM7SUFDbkIsQ0FBQztDQUNGO0FBdkJELHNCQXVCQyJ9