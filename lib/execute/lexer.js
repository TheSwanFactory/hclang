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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXhlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHNDQUE4QztBQUM5QyxxQ0FBaUM7QUFJakMsTUFBYSxLQUFNLFNBQVEsY0FBSztJQUM5QixZQUFhLEdBQVU7UUFDckIsZUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUE7UUFDeEIsS0FBSyxDQUFDLGVBQU0sQ0FBQyxDQUFBO0lBQ2YsQ0FBQztJQUVNLFVBQVUsQ0FBRSxLQUFhO1FBQzlCLE1BQU0sTUFBTSxHQUFHLElBQUksb0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNyQyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDekIsQ0FBQztJQUVNLEdBQUcsQ0FBRSxNQUFtQjtRQUM3QixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDNUIsQ0FBQztJQUVNLElBQUksQ0FBRSxRQUFlO1FBQzFCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ2hDLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUE7SUFDMUMsQ0FBQztJQUVNLE1BQU0sQ0FBRSxRQUFvQjtRQUNqQyxPQUFPLGNBQUssQ0FBQyxHQUFHLENBQUE7SUFDbEIsQ0FBQztDQUNGO0FBdkJELHNCQXVCQyJ9