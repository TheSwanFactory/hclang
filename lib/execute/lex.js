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
    }
    call(argument, parameter = frames_1.Frame.nil) {
        const char = argument.toString();
        if (this.isEnd(char) && this.isTerminal(char)) {
            return this.finish(argument, true);
        }
        if (this.isEnd(char)) {
            return this.finish(argument, !this.isQuote());
        }
        if (this.isTerminal(char) && !this.isQuote()) {
            return this.finish(argument, true);
        }
        if (this.body === "") {
            this.body = this.source;
        }
        this.body = this.body + argument.toString();
        return this;
    }
    getClassName() {
        const funcNameRegex = /function (.{1,})\(/;
        const results = (funcNameRegex).exec(this.constructor.toString());
        return (results && results.length > 1) ? results[1] : "<class>";
    }
    toString() {
        return this.getClassName() + `[${this.body}]`;
    }
    isEnd(char) {
        return !this.sample.canInclude(char);
    }
    isTerminal(char) {
        const terms = _.keys(terminals_1.terminals);
        return _.includes(terms, char);
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
        const frame = new this.factory(this.body);
        return new Token(frame);
    }
}
exports.Lex = Lex;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvbGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNEJBQTRCO0FBQzVCLHNDQUE0RjtBQUM1RiwyQ0FBd0M7QUFJeEMsTUFBYSxLQUFNLFNBQVEsa0JBQVM7SUFDbEMsWUFBc0IsSUFBVztRQUMvQixLQUFLLENBQUMsbUJBQVUsQ0FBQyxDQUFDO1FBREUsU0FBSSxHQUFKLElBQUksQ0FBTztJQUVqQyxDQUFDO0lBRU0sU0FBUyxDQUFDLE1BQWEsRUFBRSxTQUFnQjtRQUM5QyxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRVMsTUFBTSxLQUFVLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Q0FDOUM7QUFWRCxzQkFVQztBQUVELE1BQWEsR0FBSSxTQUFRLGNBQUs7SUFNNUIsWUFBNkIsT0FBWTtRQUN2QyxLQUFLLEVBQUUsQ0FBQztRQURtQixZQUFPLEdBQVAsT0FBTyxDQUFLO1FBSC9CLFNBQUksR0FBVyxFQUFFLENBQUM7UUFLMUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBRU0sSUFBSSxDQUFDLFFBQWUsRUFBRSxTQUFTLEdBQUcsY0FBSyxDQUFDLEdBQUc7UUFDaEQsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRWpDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzdDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDcEM7UUFDRCxJQUFJ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