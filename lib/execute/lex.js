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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvbGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNEJBQTJCO0FBQzNCLHNDQUEwRjtBQUMxRiwyQ0FBc0M7QUFFdEMsMkNBQXVDO0FBSXZDLE1BQWEsS0FBTSxTQUFRLGtCQUFTO0lBQ2xDLFlBQXVCLElBQVc7UUFDaEMsS0FBSyxDQUFDLG1CQUFVLENBQUMsQ0FBQTtRQURJLFNBQUksR0FBSixJQUFJLENBQU87SUFFbEMsQ0FBQztJQUVNLFNBQVMsQ0FBRSxNQUFhLEVBQUUsU0FBZ0I7UUFDL0MsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUE7SUFDM0MsQ0FBQztJQUVTLE1BQU07UUFDZCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUE7SUFDbEIsQ0FBQztDQUNGO0FBWkQsc0JBWUM7QUFFRCxNQUFhLEdBQUksU0FBUSxjQUFLO0lBVzVCLFlBQThCLE9BQVk7UUFDeEMsS0FBSyxFQUFFLENBQUE7UUFEcUIsWUFBTyxHQUFQLE9BQU8sQ0FBSztRQUhoQyxTQUFJLEdBQVcsRUFBRSxDQUFDO1FBSzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDN0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUE7UUFDaEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1FBQ25CLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQTtRQUN6QyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQTtJQUNoQyxDQUFDO0lBakJNLE1BQU0sQ0FBQyxVQUFVLENBQUUsSUFBWTtRQUNwQyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMs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