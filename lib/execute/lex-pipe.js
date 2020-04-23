"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
const frames_1 = require("../frames");
const syntax_1 = require("./syntax");
class LexPipe extends frames_1.Frame {
    constructor(out) {
        syntax_1.syntax[frames_1.Frame.kOUT] = out;
        super(syntax_1.syntax);
        this.level = 0;
    }
    lex_string(input) {
        const source = new frames_1.FrameString(input);
        return this.lex(source);
    }
    lex(source) {
        return source.reduce(this);
    }
    finish(_parameter) {
        const output = frames_1.FrameSymbol.end();
        const out = this.get(frames_1.Frame.kOUT);
        const result = out.call(output);
        return this;
    }
    perform(actions) {
        const parser = this.get(frames_1.Frame.kOUT);
        _.forEach(actions, (value, key) => {
            switch (key) {
                case 'semi-next': {
                    parser.next(true);
                    break;
                }
                case 'next': {
                    parser.next(false);
                    break;
                }
                case 'end': {
                    parser.finish(value);
                    break;
                }
                case 'push': {
                    const next_parser = parser.push(value);
                    this.set(frames_1.Frame.kOUT, next_parser);
                    this.level += 1;
                    break;
                }
                case 'pop': {
                    const next_parser = parser.pop(value);
                    this.set(frames_1.Frame.kOUT, next_parser);
                    this.level -= 1;
                    break;
                }
            }
        });
        return this;
    }
}
exports.LexPipe = LexPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LXBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXgtcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSwwQ0FBMkI7QUFDM0Isc0NBQW9FO0FBR3BFLHFDQUFpQztBQUdqQyxNQUFhLE9BQVEsU0FBUSxjQUFLO0lBR2hDLFlBQWEsR0FBVTtRQUNyQixlQUFNLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQTtRQUN4QixLQUFLLENBQUMsZUFBTSxDQUFDLENBQUE7UUFDYixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQTtJQUNoQixDQUFDO0lBRU0sVUFBVSxDQUFFLEtBQWE7UUFDOUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxvQkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3JDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUN6QixDQUFDO0lBRU0sR0FBRyxDQUFFLE1BQW1CO1FBQzdCLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUM1QixDQUFDO0lBRU0sTUFBTSxDQUFFLFVBQWlCO1FBQzlCLE1BQU0sTUFBTSxHQUFHLG9CQUFXLENBQUMsR0FBRyxFQUFFLENBQUE7UUFDaEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDaEMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUMvQixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFTSxPQUFPLENBQUUsT0FBZ0I7UUFDOUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFjLENBQUE7UUFDaEQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDaEMsUUFBUSxHQUFHLEVBQUU7Z0JBQ1gsS0FBSyxXQUFXLENBQUMsQ0FBQztvQkFDaEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtvQkFDakIsTUFBSztpQkFDTjtnQkFDRCxLQUFLLE1BQU0sQ0FBQyxDQUFDO29CQUNYLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7b0JBQ2xCLE1BQUs7aUJBQ047Z0JBQ0QsS0FBSyxLQUFLLENBQUMsQ0FBQztvQkFDVixNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO29CQUNwQixNQUFLO2lCQUNOO2dCQUNELEtBQUssTUFBTSxDQUFDLENBQUM7b0JBQ1gsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtvQkFDdEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFBO29CQUNqQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQTtvQkFDZixNQUFLO2lCQUNOO2dCQUNELEtBQUssS0FBSyxDQUFDLENBQUM7b0JBQ1YsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtvQkFDckMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFBO29CQUNqQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQTtvQkFDZixNQUFLO2lCQUNOO2FBQ0Y7UUFDSCxDQUFDLENBQUMsQ0FBQTtRQUNGLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztDQUNGO0FBekRELDBCQXlEQyJ9