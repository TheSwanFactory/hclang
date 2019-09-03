"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const terminate = (source, parameter) => {
    return source.finish(parameter);
};
class Terminal extends frames_1.Frame {
    constructor(data) {
        super(frames_1.NilContext);
        this.data = data;
        this.is.immediate = true;
    }
    static end() { return new Terminal(terminate); }
    ;
    apply(argument, parameter) {
        return this.data(argument, parameter);
    }
    toData() { return this.data; }
}
exports.Terminal = Terminal;
exports.terminals = {};
const perform = (actions) => {
    return (source, parameter) => {
        return source.perform(actions);
    };
};
exports.terminals[frames_1.Frame.kEND] = Terminal.end();
exports.terminals["\n"] = new Terminal(perform({ end: frames_1.FrameSymbol.for("\n") }));
exports.terminals["("] = new Terminal(perform({ push: frames_1.FrameExpr }));
exports.terminals[")"] = new Terminal(perform({ pop: frames_1.FrameExpr }));
exports.terminals["["] = new Terminal(perform({ push: frames_1.FrameArray }));
exports.terminals["]"] = new Terminal(perform({ pop: frames_1.FrameArray }));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvdGVybWluYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQXNHO0FBVXRHLE1BQU0sU0FBUyxHQUFtQixDQUFDLE1BQWEsRUFBRSxTQUFnQixFQUFFLEVBQUU7SUFDcEUsT0FBUSxNQUFrQixDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUMvQyxDQUFDLENBQUM7QUFFRixNQUFhLFFBQVMsU0FBUSxjQUFLO0lBR2pDLFlBQXNCLElBQW9CO1FBQ3hDLEtBQUssQ0FBQyxtQkFBVSxDQUFDLENBQUM7UUFERSxTQUFJLEdBQUosSUFBSSxDQUFnQjtRQUV4QyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQUxNLE1BQU0sQ0FBQyxHQUFHLEtBQUssT0FBTyxJQUFJLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBT2pELEtBQUssQ0FBQyxRQUFlLEVBQUUsU0FBZ0I7UUFDNUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRVMsTUFBTSxLQUFVLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Q0FDOUM7QUFiRCw0QkFhQztBQUVZLFFBQUEsU0FBUyxHQUFZLEVBQ2pDLENBQUM7QUFFRixNQUFNLE9BQU8sR0FBRyxDQUFDLE9BQWdCLEVBQUUsRUFBRTtJQUNuQyxPQUFPLENBQUMsTUFBYSxFQUFFLFNBQWdCLEVBQUUsRUFBRTtRQUN6QyxPQUFRLE1BQXFCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pELENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQztBQUVGLGlCQUFTLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUN2QyxpQkFBUyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFDLEdBQUcsRUFBRSxvQkFBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztBQUN0RSxpQkFBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFDLElBQUksRUFBRSxrQkFBUyxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFELGlCQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUMsR0FBRyxFQUFFLGtCQUFTLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekQsaUJBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBQyxJQUFJLEVBQUUsbUJBQVUsRUFBQyxDQUFDLENBQUMsQ0FBQztBQUMzRCxpQkFBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFDLEdBQUcsRUFBRSxtQkFBVSxFQUFDLENBQUMsQ0FBQyxDQUFDIn0=