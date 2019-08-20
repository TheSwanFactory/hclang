#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prompt_sync = require("prompt-sync");
const prompt_history = require("prompt-sync-history");
const version_1 = require("../version");
const prompt = prompt_sync({
    history: prompt_history(),
});
class HChat {
    constructor(hc) {
        this.hc = hc;
    }
    static iterate(hc) {
        console.log(".hc " + version_1.version);
        const hchat = new HChat(hc);
        return hchat.call();
    }
    call() {
        let status = true;
        while (status) {
            const input = prompt(HChat.IN);
            const output = this.hc.evaluate(input);
            debugger;
            console.log(HChat.OUT + output);
            status = false;
        }
        return true;
    }
}
HChat.IN = "; ";
HChat.OUT = "# ";
exports.HChat = HChat;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGNoYXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpL2hjaGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJDQUEyQztBQUMzQyxzREFBc0Q7QUFHdEQsd0NBQXFDO0FBRXJDLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQztJQUN6QixPQUFPLEVBQUUsY0FBYyxFQUFFO0NBQzFCLENBQUMsQ0FBQztBQUVILE1BQWEsS0FBSztJQVVoQixZQUFzQixFQUFNO1FBQU4sT0FBRSxHQUFGLEVBQUUsQ0FBSTtJQUM1QixDQUFDO0lBUE0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFNO1FBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLGlCQUFPLENBQUMsQ0FBQztRQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM1QixPQUFPLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBS00sSUFBSTtRQUNULElBQUksTUFBTSxHQUFHLElBQUksQ0FBQztRQUNsQixPQUFPLE1BQU0sRUFBRTtZQUNiLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDL0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkMsUUFBUSxDQUFDO1lBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sR0FBRyxLQUFLLENBQUM7U0FDaEI7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7O0FBdEJzQixRQUFFLEdBQUcsSUFBSSxDQUFDO0FBQ1YsU0FBRyxHQUFHLElBQUksQ0FBQztBQUZwQyxzQkF3QkMifQ==