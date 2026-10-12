import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameResource } from "./frame-resource.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";

export type ImportTarget =
  | { readonly kind: "local" }
  | { readonly kind: "named"; readonly key: string };

export type ImportSourceEvaluator = (
  resource: FrameResource,
  scope: EvaluationScope,
) => Frame;

/** An import expression whose source evaluator is supplied by the pipeline. */
export class FrameImport extends Frame {
  public constructor(
    public readonly target: ImportTarget,
    public readonly resourceExpression: Frame,
    private readonly evaluateSource: ImportSourceEvaluator,
  ) {
    super();
  }

  public override in(input: EvaluationInput = []): Frame {
    const scope = EvaluationScope.from(input);
    let importScope = scope;

    if (this.target.kind === "named") {
      const namespace = new FrameArray([]);
      namespace.up = scope.lexicalTarget;
      const binding = FrameSymbol.for(this.target.key)
        .setter(scope.writeTarget)
        .apply(namespace, Frame.nil);
      if (binding.isFailedResult()) return binding;
      importScope = scope.namedChild(namespace);
    }

    const resource = this.resourceExpression.in(scope);
    if (resource.isFailedResult()) return resource;
    if (!(resource instanceof FrameResource)) {
      return Frame.error(
        `$!.resource-import-source-type ${resource.toString()}`,
      );
    }
    return this.evaluateSource(resource, importScope);
  }

  public override toString(): string {
    const target = this.target.kind === "local" ? "." : this.target.key;
    return `${target} <- ${this.resourceExpression.toString()}`;
  }
}
