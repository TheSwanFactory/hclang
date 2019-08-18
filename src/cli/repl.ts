#!/usr/bin/env node

import * as prompter from "prompt-sync";
import * as prompt_history from "prompt-sync-history";
import { execute } from "../execute";

const prompt = prompter({
  history: prompt_history(),
});

const name = prompt("enter name: ", "Ernie");
console.log("name " + name);
