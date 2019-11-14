"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
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
                case "semi-next": {
                    parser.next(true);
                    break;
                }
                case "next": {
                    parser.next(false);
                    break;
                }
                case "end": {
                    parser.finish(value);
                    break;
                }
                case "push": {
                    const next_parser = parser.push(value);
                    this.set(frames_1.Frame.kOUT, next_parser);
                    this.level += 1;
                    break;
                }
                case "pop": {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LXBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXgtcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRCQUE0QjtBQUM1QixzQ0FBcUU7QUFHckUscUNBQWtDO0FBR2xDLE1BQWEsT0FBUSxTQUFRLGNBQUs7SUFJaEMsWUFBWSxHQUFVO1FBQ3BCLGVBQU0sQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQ3pCLEtBQUssQ0FBQyxlQUFNLENBQUMsQ0FBQztRQUNkLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLENBQUM7SUFFTSxVQUFVLENBQUMsS0FBYTtRQUM3QixNQUFNLE1BQU0sR0FBRyxJQUFJLG9CQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEMsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFTSxHQUFHLENBQUMsTUFBbUI7UUFDNUIsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFTSxNQUFNLENBQUMsVUFBaUI7UUFDN0IsTUFBTSxNQUFNLEdBQUcsb0JBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNqQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLE9BQU8sQ0FBQyxPQUFnQjtRQUM3QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQWMsQ0FBQztRQUNqRCxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUNoQyxRQUFRLEdBQUcsRUFBRTtnQkFDWCxLQUFLLFdBQVcsQ0FBQyxDQUFDO29CQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNsQixNQUFNO2lCQUNQO2dCQUNELEtBQUssTUFBTSxDQUFDLENBQUM7b0JBQ1gsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDbkIsTUFBTTtpQkFDUDtnQkFDRCxLQUFLLEtBQUssQ0FBQyxDQUFDO29CQUNWLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3JCLE1BQU07aUJBQ1A7Z0JBQ0QsS0FBSyxNQUFNLENBQUMsQ0FBQztvQkFDWCxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN2QyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7b0JBQ2xDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO29CQUNoQixNQUFNO2lCQUNQO2dCQUNELEtBQUssS0FBSyxDQUFDLENBQUM7b0JBQ1YsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDdEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO29CQUNsQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztvQkFDaEIsTUFBTTtpQkFDUDthQUNGO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FFRjtBQTNERCwwQkEyREMifQ==