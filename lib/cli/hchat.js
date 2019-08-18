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
        const hchat = new HChat(hc);
        return hchat.call();
    }
    call() {
        let status = false;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGNoYXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpL2hjaGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJDQUEyQztBQUMzQyxzREFBc0Q7QUFJdEQsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDO0lBQ3pCLE9BQU8sRUFBRSxjQUFjLEVBQUU7Q0FDMUIsQ0FBQyxDQUFDO0FBRUgsTUFBYSxLQUFLO0lBU2hCLFlBQXNCLEVBQU07UUFBTixPQUFFLEdBQUYsRUFBRSxDQUFJO0lBQzVCLENBQUM7SUFOTSxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQU07UUFDMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDNUIsT0FBTyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUtNLElBQUk7UUFDVCxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDbkIsT0FBTyxNQUFNLEVBQUU7WUFDYixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQy9CLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsQ0FBQztZQUNoQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1NBQ2Y7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7O0FBcEJzQixRQUFFLEdBQUcsSUFBSSxDQUFDO0FBQ1YsU0FBRyxHQUFHLElBQUksQ0FBQztBQUZwQyxzQkFzQkMifQ==