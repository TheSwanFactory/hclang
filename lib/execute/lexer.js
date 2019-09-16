"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const syntax_1 = require("./syntax");
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
    finish(_options) {
        return frames_1.Frame.nil;
    }
}
exports.Lexer = Lexer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXhlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHNDQUErQztBQUMvQyxxQ0FBa0M7QUFJbEMsTUFBYSxLQUFNLFNBQVEsY0FBSztJQUM5QixZQUFZLEdBQVU7UUFDcEIsZUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDekIsS0FBSyxDQUFDLGVBQU0sQ0FBQyxDQUFDO0lBQ2hCLENBQUM7SUFFTSxVQUFVLENBQUMsS0FBYTtRQUM3QixNQUFNLE1BQU0sR0FBRyxJQUFJLG9CQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEMsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFTSxHQUFHLENBQUMsTUFBbUI7UUFDNUIsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFTSxJQUFJLENBQUMsUUFBZTtRQUN6QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFTSxNQUFNLENBQUMsUUFBb0I7UUFDaEMsT0FBTyxjQUFLLENBQUMsR0FBRyxDQUFDO0lBQ25CLENBQUM7Q0FDRjtBQXZCRCxzQkF1QkMifQ==