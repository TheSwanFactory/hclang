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
            this.up.call(argument);
        }
        return this.pipe;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvbGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNEJBQTRCO0FBQzVCLHNDQUErRTtBQUUvRSwyQ0FBd0M7QUFJeEMsTUFBYSxLQUFNLFNBQVEsa0JBQVM7SUFDbEMsWUFBc0IsSUFBVztRQUMvQixLQUFLLENBQUMsbUJBQVUsQ0FBQyxDQUFDO1FBREUsU0FBSSxHQUFKLElBQUksQ0FBTztJQUVqQyxDQUFDO0lBRU0sU0FBUyxDQUFDLE1BQWEsRUFBRSxTQUFnQjtRQUM5QyxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRVMsTUFBTSxLQUFVLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Q0FDOUM7QUFWRCxzQkFVQztBQUVELE1BQWEsR0FBSSxTQUFRLGNBQUs7SUFZNUIsWUFBNkIsT0FBWTtRQUN2QyxLQUFLLEVBQUUsQ0FBQztRQURtQixZQUFPLEdBQVAsT0FBTyxDQUFLO1FBSC9CLFNBQUksR0FBVyxFQUFFLENBQUM7UUFLMUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNqQixJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDcEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO1FBQzFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO0lBQ2pDLENBQUM7SUFqQk0sTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFZO1FBQ25DLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMscUJB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