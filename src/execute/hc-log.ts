import { Context, Frame } from '../frames'
import { HCEval } from './hc-eval'

export type Counts = { [key: string]: number; };

export class HCLog extends Frame {
  constructor (context: Context, public prompt: boolean = false) {
    super(context)
  }

  public apply (argument: Frame, _parameter = Frame.nil): Frame {
    const debug = this.get('DEBUG')
    if (debug !== Frame.missing) {
      console.log(argument.id, argument)
    }
    if (argument !== Frame.nil && !argument.is.void && !argument.is.statement) {
      const output = argument.toString()
      if (this.prompt) {
        console.log((HCEval.EXPECT + output))
      } else {
        const colorized = this.color(output)
        console.log(colorized)
      }
    }
    return argument
  }

  private color (output: string): string {
    if (output[0] !== '$') {
      return output
    }
    const flag = output[1]
    const part = output.split(' .n ')
    switch (flag) {
      case '+': return (part[0]) + (part[1])
      case '-': return (part[0]) + (part[1])
      default: return (output)
    }
  }
}
