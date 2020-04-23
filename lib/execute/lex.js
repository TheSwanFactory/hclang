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
const lex_bytes_1 = require("./lex-bytes");
const terminals_1 = require("./terminals");
class Token extends frames_1.FrameAtom {
    constructor(data) {
        super(frames_1.NilContext);
        this.data = data;
    }
    called_by(callee, parameter) {
        return callee.apply(this.data, parameter);
    }
    toData() {
        return this.data;
    }
}
exports.Token = Token;
class Lex extends frames_1.Frame {
    constructor(Factory) {
        super();
        this.Factory = Factory;
        this.body = '';
        this.sample = new Factory('');
        this.source = '';
        this.is.void = true;
        const name = this.sample.constructor.name;
        this.id = this.id + '.' + name;
    }
    static isTerminal(char) {
        const terms = _.keys(terminals_1.terminals);
        return _.includes(terms, char);
    }
    call(argument, _parameter = frames_1.Frame.nil) {
        const char = argument.toString();
        if (this.isEnd(char) && Lex.isTerminal(char)) {
            return this.finish(argument, true);
        }
        if (this.isEnd(char)) {
            return this.finish(argument, !this.isQuote());
        }
        if (Lex.isTerminal(char) && !this.isQuote()) {
            return this.finish(argument, true);
        }
        if (this.body === '') {
            this.body = this.source;
        }
        this.body = this.body + argument.toString();
        return this;
    }
    toString() {
        return this.id + `[${this.body}]`;
    }
    isEnd(char) {
        return !this.sample.canInclude(char);
    }
    isQuote() {
        return (this.sample instanceof frames_1.FrameQuote);
    }
    finish(argument, passAlong) {
        const recurse = this.checkRecursive(argument);
        if (recurse !== null) {
            return recurse;
        }
        this.exportFrame();
        if (passAlong) {
            const result = this.up.call(argument);
            return result;
        }
        return this.up;
    }
    checkRecursive(_argument) {
        if (!(this.sample instanceof frames_1.FrameBytes)) {
            return null;
        }
        const n = parseInt(this.body, 10);
        const lex = new lex_bytes_1.LexBytes(n, this.up);
        return lex;
    }
    exportFrame() {
        const output = this.makeFrame();
        const out = this.get(frames_1.Frame.kOUT);
        return out.call(output);
    }
    makeFrame() {
        if (this.body === '') {
            this.body = this.source;
        }
        const frame = new this.Factory(this.body);
        this.body = '';
        return new Token(frame);
    }
}
exports.Lex = Lex;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvbGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLDBDQUEyQjtBQUMzQixzQ0FBMEY7QUFDMUYsMkNBQXNDO0FBRXRDLDJDQUF1QztBQUl2QyxNQUFhLEtBQU0sU0FBUSxrQkFBUztJQUNsQyxZQUF1QixJQUFXO1FBQ2hDLEtBQUssQ0FBQyxtQkFBVSxDQUFDLENBQUE7UUFESSxTQUFJLEdBQUosSUFBSSxDQUFPO0lBRWxDLENBQUM7SUFFTSxTQUFTLENBQUUsTUFBYSxFQUFFLFNBQWdCO1FBQy9DLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0lBQzNDLENBQUM7SUFFUyxNQUFNO1FBQ2QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFBO0lBQ2xCLENBQUM7Q0FDRjtBQVpELHNCQVlDO0FBRUQsTUFBYSxHQUFJLFNBQVEsY0FBSztJQVc1QixZQUE4QixPQUFZO1FBQ3hDLEtBQUssRUFBRSxDQUFBO1FBRHFCLFlBQU8sR0FBUCxPQUFPLENBQUs7UUFIaEMsU0FBSSxHQUFXLEVBQUUsQ0FBQztRQUsxQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQzdCLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFBO1FBQ2hCLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtRQUNuQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUE7UUFDekMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUE7SUFDaEMsQ0FBQztJQWpCTSxNQUFNLENBQUMsVUFBVSxDQUFFLElBQVk7UUFDcEMsTUFBTSxLQUFLLEdBQUcsQ0FB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