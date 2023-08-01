import NodeVisitor from "./node-visitor";

export default interface VisitableNode {
    visit(visitor: NodeVisitor): void;
}