import NodeVisitor from "./node-visitor";
import SectionNode from "./section-node";
import VisitableNode from "./visitable-node";

export default class RecipeNode implements VisitableNode {
    sectionNodes: SectionNode[];

    constructor(sectionNodes: SectionNode[]) {
        this.sectionNodes = sectionNodes;
    }

    visit(visitor: NodeVisitor) {
        for (let section of this.sectionNodes) {
            section.visit(visitor);
        }
    }
}