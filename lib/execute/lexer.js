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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXhlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHNDQUFnRjtBQUdoRixxQ0FBa0M7QUFFbEMsTUFBTSxXQUFZLFNBQVEsY0FBSztJQUM3QixZQUFzQixPQUFtQjtRQUN2QyxLQUFLLENBQUMsbUJBQVUsQ0FBQyxDQUFDO1FBREUsWUFBTyxHQUFQLE9BQU8sQ0FBWTtRQUV2QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztJQUNyQixDQUFDO0lBRU0sS0FBSyxDQUFDLFFBQWUsRUFBRSxTQUFnQjtRQUM1QyxNQUFNLE1BQU0sR0FBRyxRQUFpQixDQUFDO1FBQ2pDLE1BQU0sT0FBTyxHQUFHLFNBQXVCLENBQUM7UUFDeEMsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hDLENBQUM7Q0FDRjtBQUVELE1BQWEsS0FBTSxTQUFRLGNBQUs7SUFDOUIsWUFBWSxHQUFVO1FBQ3BCLGVBQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQ3pCLEtBQUssQ0FBQyxlQUFNLENBQUMsQ0FBQztJQUNoQixDQUFDO0lBRU0sVUFBVSxDQUFDLEtBQWE7UUFDN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxvQkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBRU0sR0FBRyxDQUFDLE1BQW1CO1FBQzVCLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRU0sSUFBSSxDQUFDLFFBQWU7UUFDekIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRU0sTUFBTSxDQUFDLE9BQW1CO1FBQy9CLE9BQU8sY0FBSyxDQUFDLEdBQUcsQ0FBQztJQUNuQixDQUFDO0NBQ0Y7QUF2QkQsc0JBdUJDIn0=