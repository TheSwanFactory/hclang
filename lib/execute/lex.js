"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
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
        return new lex_bytes_1.LexBytes(n);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvbGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNEJBQTRCO0FBQzVCLHNDQUEyRjtBQUMzRiwyQ0FBdUM7QUFFdkMsMkNBQXdDO0FBSXhDLE1BQWEsS0FBTSxTQUFRLGtCQUFTO0lBQ2xDLFlBQXNCLElBQVc7UUFDL0IsS0FBSyxDQUFDLG1CQUFVLENBQUMsQ0FBQztRQURFLFNBQUksR0FBSixJQUFJLENBQU87SUFFakMsQ0FBQztJQUVNLFNBQVMsQ0FBQyxNQUFhLEVBQUUsU0FBZ0I7UUFDOUMsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVTLE1BQU0sS0FBVSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0NBQzlDO0FBVkQsc0JBVUM7QUFFRCxNQUFhLEdBQUksU0FBUSxjQUFLO0lBWTVCLFlBQTZCLE9BQVk7UUFDdkMsS0FBSyxFQUFFLENBQUM7UUFEbUIsWUFBTyxHQUFQLE9BQU8sQ0FBSztRQUgvQixTQUFJLEdBQVcsRUFBRSxDQUFDO1FBSzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDOUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDakIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztRQUMxQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQztJQUNqQyxDQUFDO0lBakJNLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBWTtRQUNuQyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMs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