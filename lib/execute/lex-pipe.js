"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const frames_1 = require("../frames");
const syntax_1 = require("./syntax");
class LexPipe extends frames_1.Frame {
    constructor(out) {
        syntax_1.syntax[frames_1.Frame.kOUT] = out;
        super(syntax_1.syntax);
    }
    lex_string(input) {
        const source = new frames_1.FrameString(input);
        return this.lex(source);
    }
    lex(source) {
        return source.reduce(this);
    }
    finish(parameter) {
        const output = frames_1.FrameSymbol.end();
        const out = this.get(frames_1.Frame.kOUT);
        return out.call(output);
    }
    perform(actions) {
        const parser = this.get(frames_1.Frame.kOUT);
        _.forEach(actions, (value, key) => {
            switch (key) {
                case "next": {
                    const header = (value === ";") ? true : false;
                    parser.next(header);
                    break;
                }
                case "end": {
                    parser.finish(value);
                    break;
                }
                case "push": {
                    const next_parser = parser.push(value);
                    this.set(frames_1.Frame.kOUT, next_parser);
                    break;
                }
                case "pop": {
                    const next_parser = parser.pop(value);
                    this.set(frames_1.Frame.kOUT, next_parser);
                    break;
                }
            }
        });
        return this;
    }
}
exports.LexPipe = LexPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LXBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXgtcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRCQUE0QjtBQUM1QixzQ0FBcUU7QUFFckUscUNBQWtDO0FBR2xDLE1BQWEsT0FBUSxTQUFRLGNBQUs7SUFDaEMsWUFBWSxHQUFVO1FBQ3BCLGVBQU0sQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQ3pCLEtBQUssQ0FBQyxlQUFNLENBQUMsQ0FBQztJQUNoQixDQUFDO0lBRU0sVUFBVSxDQUFDLEtBQWE7UUFDN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxvQkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBRU0sR0FBRyxDQUFDLE1BQW1CO1FBQzVCLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRU0sTUFBTSxDQUFDLFNBQWdCO1FBQzVCLE1BQU0sTUFBTSxHQUFHLG9CQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDakMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFTSxPQUFPLENBQUMsT0FBZ0I7UUFDN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFjLENBQUM7UUFDakQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDaEMsUUFBUSxHQUFHLEVBQUU7Z0JBQ1gsS0FBSyxNQUFNLENBQUMsQ0FBQztvQkFDWCxNQUFNLE1BQU0sR0FBRyxDQUFDLEtBQUssS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7b0JBQzlDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ3BCLE1BQU07aUJBQ1A7Z0JBQ0QsS0FBSyxLQUFLLENBQUMsQ0FBQztvQkFDVixNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNyQixNQUFNO2lCQUNQO2dCQUNELEtBQUssTUFBTSxDQUFDLENBQUM7b0JBQ1gsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO29CQUNsQyxNQUFNO2lCQUNQO2dCQUNELEtBQUssS0FBSyxDQUFDLENBQUM7b0JBQ1YsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDdEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO29CQUNsQyxNQUFNO2lCQUNQO2FBQ0Y7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztDQUVGO0FBakRELDBCQWlEQyJ9