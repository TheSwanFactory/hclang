#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prompt_sync = require("prompt-sync");
const prompt_history = require("prompt-sync-history");
const prompt = prompt_sync({
    history: prompt_history(),
});
class HChat {
    constructor(hc) {
        this.hc = hc;
    }
    static iterate(hc) {
        console.log("HChat.iterate");
        const hchat = new HChat(hc);
        return hchat.call();
    }
    call() {
        let status = true;
        while (status) {
            const input = prompt(HChat.IN);
            const output = this.hc.evaluate(input);
            console.log(HChat.OUT + output);
            status = true;
        }
        return true;
    }
}
HChat.IN = "; ";
HChat.OUT = "# ";
exports.HChat = HChat;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGNoYXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpL2hjaGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJDQUEyQztBQUMzQyxzREFBc0Q7QUFJdEQsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDO0lBQ3pCLE9BQU8sRUFBRSxjQUFjLEVBQUU7Q0FDMUIsQ0FBQyxDQUFDO0FBRUgsTUFBYSxLQUFLO0lBVWhCLFlBQXNCLEVBQU07UUFBTixPQUFFLEdBQUYsRUFBRSxDQUFJO0lBQzVCLENBQUM7SUFQTSxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQU07UUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUM3QixNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM1QixPQUFPLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBS00sSUFBSTtRQUNULElBQUksTUFBTSxHQUFHLElBQUksQ0FBQztRQUNsQixPQUFPLE1BQU0sRUFBRTtZQUNiLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDL0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sR0FBRyxJQUFJLENBQUM7U0FDZjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQzs7QUFyQnNCLFFBQUUsR0FBRyxJQUFJLENBQUM7QUFDVixTQUFHLEdBQUcsSUFBSSxDQUFDO0FBRnBDLHNCQXVCQyJ9