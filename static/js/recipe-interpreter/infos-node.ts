import { InfoNode } from "./info-node";
import NodeVisitor from "./node-visitor";
import SectionNode from "./section-node";

export default class InfosNode implements SectionNode {
    nodes: InfoNode<any>[];

    constructor(nodes: InfoNode<any>[]) {
        this.nodes = nodes;
    }

    visit(visitor: NodeVisitor) {
        for (let node of this.nodes) {
            node.visit(visitor);
        }
    }
}