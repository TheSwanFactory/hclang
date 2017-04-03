import * as _ from "lodash";
import { Context, Frame } from "../frames";
import { Terminal, terminals } from "./terminals";
import { tokens } from "./tokens";

const meta = _.clone(tokens);
_.merge(meta, terminals);

export const syntax = meta;
