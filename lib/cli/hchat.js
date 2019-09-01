#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prompt_sync = require("prompt-sync");
const prompt_history = require("prompt-sync-history");
const frames_1 = require("../frames");
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
            if (!input) {
                status = false;
                break;
            }
            const output = this.hc.evaluate(input);
            const debug = this.hc.get("DEBUG");
            if (debug !== frames_1.Frame.missing) {
                console.log(output);
            }
            console.log(HChat.OUT + output);
        }
        return status;
    }
}
exports.HChat = HChat;
HChat.IN = "; ";
HChat.OUT = "# ";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGNoYXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpL2hjaGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJDQUEyQztBQUMzQyxzREFBc0Q7QUFFdEQsc0NBQWtDO0FBQ2xDLHdDQUFxQztBQUVyQyxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUM7SUFDekIsT0FBTyxFQUFFLGNBQWMsRUFBRTtDQUMxQixDQUFDLENBQUM7QUFFSCxNQUFhLEtBQUs7SUFVaEIsWUFBc0IsRUFBTTtRQUFOLE9BQUUsR0FBRixFQUFFLENBQUk7SUFDNUIsQ0FBQztJQVBNLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBTTtRQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxpQkFBTyxDQUFDLENBQUM7UUFDOUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDNUIsT0FBTyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUtNLElBQUk7UUFDVCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFDbEIsT0FBTyxNQUFNLEVBQUU7WUFDYixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ1YsTUFBTSxHQUFHLEtBQUssQ0FBQztnQkFDZixNQUFNO2FBQ1A7WUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNuQyxJQUFJLEtBQUssS0FBSyxjQUFLLENBQUMsT0FBTyxFQUFFO2dCQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3JCO1lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1NBQ2pDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQzs7QUE3Qkgsc0JBOEJDO0FBN0J3QixRQUFFLEdBQUcsSUFBSSxDQUFDO0FBQ1YsU0FBRyxHQUFHLElBQUksQ0FBQyJ9