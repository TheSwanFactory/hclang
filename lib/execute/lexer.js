"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const syntax_1 = require("./syntax");
class LexTerminal extends frames_1.Frame {
    constructor(options) {
        super(frames_1.NilContext);
        this.options = options;
        this.is.immediate = true;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXhlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHNDQUEyRDtBQUMzRCxxQ0FBa0M7QUFJbEMsTUFBTSxXQUFZLFNBQVEsY0FBSztJQUM3QixZQUFzQixPQUFtQjtRQUN2QyxLQUFLLENBQUMsbUJBQVUsQ0FBQyxDQUFDO1FBREUsWUFBTyxHQUFQLE9BQU8sQ0FBWTtRQUV2QyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQUVNLEtBQUssQ0FBQyxRQUFlLEVBQUUsU0FBZ0I7UUFDNUMsTUFBTSxNQUFNLEdBQUcsUUFBaUIsQ0FBQztRQUNqQyxNQUFNLE9BQU8sR0FBRyxTQUF1QixDQUFDO1FBQ3hDLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNoQyxDQUFDO0NBQ0Y7QUFFRCxNQUFhLEtBQU0sU0FBUSxjQUFLO0lBQzlCLFlBQVksR0FBVTtRQUNwQixlQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUN6QixLQUFLLENBQUMsZUFBTSxDQUFDLENBQUM7SUFDaEIsQ0FBQztJQUVNLFVBQVUsQ0FBQyxLQUFhO1FBQzdCLE1BQU0sTUFBTSxHQUFHLElBQUksb0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0QyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVNLEdBQUcsQ0FBQyxNQUFtQjtRQUM1QixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVNLElBQUksQ0FBQyxRQUFlO1FBQ3pCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVNLE1BQU0sQ0FBQyxPQUFtQjtRQUMvQixPQUFPLGNBQUssQ0FBQyxHQUFHLENBQUM7SUFDbkIsQ0FBQztDQUNGO0FBdkJELHNCQXVCQyJ9