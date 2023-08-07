import { Recipe } from "../recipe";
import NodeVisitor from "./node-visitor";
import VisitableNode from "./visitable-node";

export class InfoNode<T extends keyof Recipe> implements VisitableNode {
    key: T;
    value: Recipe[T];

    constructor(key: T, value: Recipe[T]) {
        this.key = key;
        this.value = value;
    }

    visit(visitor: NodeVisitor) {
        visitor.setInfo(this.key, this.value);
    }
}