"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const frames_1 = require("../frames");
const terminals_1 = require("./terminals");
class Token extends frames_1.FrameAtom {
    constructor(data) {
        super(frames_1.NilContext);
        this.data = data;
    }
    called_by(callee, parameter) {
        return callee.apply(this.data, parameter);
    }
    toData() { return this.data; }
}
exports.Token = Token;
class Lex extends frames_1.Frame {
    constructor(factory) {
        super();
        this.factory = factory;
        this.body = "";
        this.sample = new factory("");
        this.source = "";
        this.is.void = true;
        const name = this.sample.constructor.name;
        this.id = this.id + "." + name;
    }
    static isTerminal(char) {
        const terms = _.keys(terminals_1.terminals);
        return _.includes(terms, char);
    }
    call(argument, parameter = frames_1.Frame.nil) {
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
        if (this.body === "") {
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
        this.exportFrame();
        if (passAlong) {
            const result = this.up.call(argument);
            return result;
        }
        return this.up;
    }
    exportFrame() {
        const output = this.makeFrame();
        const out = this.get(frames_1.Frame.kOUT);
        this.body = "";
        return out.call(output);
    }
    makeFrame() {
        if (this.body === "") {
            this.body = this.source;
        }
        const frame = new this.factory(this.body);
        return new Token(frame);
    }
}
exports.Lex = Lex;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvbGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNEJBQTRCO0FBQzVCLHNDQUErRTtBQUMvRSwyQ0FBd0M7QUFJeEMsTUFBYSxLQUFNLFNBQVEsa0JBQVM7SUFDbEMsWUFBc0IsSUFBVztRQUMvQixLQUFLLENBQUMsbUJBQVUsQ0FBQyxDQUFDO1FBREUsU0FBSSxHQUFKLElBQUksQ0FBTztJQUVqQyxDQUFDO0lBRU0sU0FBUyxDQUFDLE1BQWEsRUFBRSxTQUFnQjtRQUM5QyxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRVMsTUFBTSxLQUFVLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Q0FDOUM7QUFWRCxzQkFVQztBQUVELE1BQWEsR0FBSSxTQUFRLGNBQUs7SUFXNUIsWUFBNkIsT0FBWTtRQUN2QyxLQUFLLEVBQUUsQ0FBQztRQURtQixZQUFPLEdBQVAsT0FBTyxDQUFLO1FBSC9CLFNBQUksR0FBVyxFQUFFLENBQUM7UUFLMUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNqQixJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDcEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO1FBQzFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO0lBQ2pDLENBQUM7SUFoQk0sTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFZO1FBQ25DLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMscUJB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