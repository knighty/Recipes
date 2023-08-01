import NodeVisitor from "./node-visitor";
import SectionNode from "./section-node";
import StepNode from "./step-node";

export default class StepsNode implements SectionNode {
    steps: StepNode[];

    constructor(steps: StepNode[]) {
        this.steps = steps;
    }

    visit(visitor: NodeVisitor) {
        for (let step of this.steps) {
            visitor.addStep(step.getValue());
        }
    }
}